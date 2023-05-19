//@ts-check

var lang = require("./lang.js");
var ChatGPTModels = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301",
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-32k",
    "gpt-4-32k-0314",
];

var SYSTEM_PROMPT = "You are a translation engine that can only translate text and cannot interpret it."

/**
 * @param {string}  url
 * @returns {string} 
*/
function ensureHttpsAndNoTrailingSlash(url) {
    const hasProtocol = /^[a-z]+:\/\//i.test(url);
    const modifiedUrl = hasProtocol ? url : 'https://' + url;

    return modifiedUrl.endsWith('/') ? modifiedUrl.slice(0, -1) : modifiedUrl;
}

/**
 * @param {boolean} isAzureServiceProvider - Indicates if the service provider is Azure.
 * @param {string} apiKey - The authentication API key.
 * @returns {{
*   "Content-Type": string;
*   "api-key"?: string;
*   "Authorization"?: string;
* }} The header object.
*/
function buildHeader(isAzureServiceProvider, apiKey) {
    return {
        "Content-Type": "application/json",
        [isAzureServiceProvider ? "api-key" : "Authorization"]: isAzureServiceProvider ? apiKey : `Bearer ${apiKey}`
    };
}

/**
 * @param {Bob.TranslateQuery} query
 * @returns {{ 
 *  generatedSystemPrompt: string, 
 *  generatedUserPrompt: string 
 * }}
*/
function generatePrompts(query) {
    let generatedSystemPrompt = SYSTEM_PROMPT;
    const { detectFrom, detectTo } = query;
    const sourceLang = lang.langMap.get(detectFrom) || detectFrom;
    const targetLang = lang.langMap.get(detectTo) || detectTo;
    let generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}`;

    if (detectTo === "wyw" || detectTo === "yue") {
        generatedUserPrompt = `翻译成${targetLang}`;
    }

    if (
        detectFrom === "wyw" ||
        detectFrom === "zh-Hans" ||
        detectFrom === "zh-Hant"
    ) {
        if (detectTo === "zh-Hant") {
            generatedUserPrompt = "翻译成繁体白话文";
        } else if (detectTo === "zh-Hans") {
            generatedUserPrompt = "翻译成简体白话文";
        } else if (detectTo === "yue") {
            generatedUserPrompt = "翻译成粤语白话文";
        }
    }
    if (detectFrom === detectTo) {
        generatedSystemPrompt =
            "You are a text embellisher, you can only embellish the text, don't interpret it.";
        if (detectTo === "zh-Hant" || detectTo === "zh-Hans") {
            generatedUserPrompt = "润色此句";
        } else {
            generatedUserPrompt = "polish this sentence";
        }
    }

    generatedUserPrompt = `${generatedUserPrompt}:\n\n${query.text}`

    return { generatedSystemPrompt, generatedUserPrompt };
}

/**
 * @param {string} prompt
 * @param {Bob.TranslateQuery} query
 * @returns {string}
*/
function replacePromptKeywords(prompt, query) {
    if (!prompt) return prompt;
    return prompt.replace("$text", query.text)
        .replace("$sourceLang", query.detectFrom)
        .replace("$targetLang", query.detectTo);
}

/**
 * @param {typeof ChatGPTModels[number]} model
 * @param {boolean} isChatGPTModel
 * @param {Bob.TranslateQuery} query
 * @returns {{ 
 *  model: typeof ChatGPTModels[number];
 *  temperature: number;
 *  max_tokens: number;
 *  top_p: number;
 *  frequency_penalty: number;
 *  presence_penalty: number;
 *  messages?: {
 *    role: "system" | "user";
 *    content: string;
 *  }[];
 *  prompt?: string;
 * }}
*/
function buildRequestBody(model, isChatGPTModel, query) {
    let { customSystemPrompt, customUserPrompt } = $option;
    const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query);

    customSystemPrompt = replacePromptKeywords(customSystemPrompt, query);
    customUserPrompt = replacePromptKeywords(customUserPrompt, query);

    const systemPrompt = customSystemPrompt || generatedSystemPrompt;
    const userPrompt = customUserPrompt || generatedUserPrompt;

    const standardBody = {
        model,
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    };

    if (isChatGPTModel) {
        return {
            ...standardBody,
            model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        };
    }
    return {
        ...standardBody,
        model,
        prompt: userPrompt,
    };
}


/**
 * @param {Bob.TranslateQuery} query
 * @param {Bob.HttpResponse} result
 * @returns {void}
*/
function handleError(query, result) {
    const { statusCode } = result.response;
    const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
    query.onCompletion({
        error: {
            type: reason,
            message: `接口响应错误 - ${result.data.error.message}`,
            addtion: JSON.stringify(result),
        },
    });
}

/**
 * @param {boolean} isChatGPTModel
 * @param {Bob.TranslateQuery} query
 * @param {Bob.HttpResponse} result
 * @returns {void}
*/
function handleResponse(isChatGPTModel, query, result) {
    const { choices } = result.data;

    if (!choices || choices.length === 0) {
        query.onCompletion({
            error: {
                type: "api",
                message: "接口未返回结果",
                addtion: JSON.stringify(result),
            },
        });
        return;
    }

    let targetText = (isChatGPTModel ? choices[0].message.content : choices[0].text).trim();

    query.onCompletion({
        result: {
            from: query.detectFrom,
            to: query.detectTo,
            toParagraphs: targetText.split("\n"),
        },
    });
}

/**
 * @type {Bob.Translate}
 */
function translate(query) {
    if (!lang.langMap.get(query.detectTo)) {
        query.onCompletion({
            error: {
                type: "unsupportLanguage",
                message: "不支持该语种",
                addtion: "不支持该语种",
            },
        });
    }

    const { model, apiKeys, apiUrl, deploymentName } = $option;

    if (!apiKeys) {
        query.onCompletion({
            error: {
                type: "secretKey",
                message: "配置错误 - 请确保您在插件配置中填入了正确的 API Keys",
                addtion: "请在插件配置中填写 API Keys",
            },
        });
    }
    const trimmedApiKeys = apiKeys.endsWith(",") ? apiKeys.slice(0, -1) : apiKeys;
    const apiKeySelection = trimmedApiKeys.split(",").map(key => key.trim());
    const apiKey = apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];

    const modifiedApiUrl = ensureHttpsAndNoTrailingSlash(apiUrl || "https://api.openai.com");
    
    const isChatGPTModel = ChatGPTModels.includes(model);
    const isAzureServiceProvider = modifiedApiUrl.includes("openai.azure.com");
    let apiUrlPath = isChatGPTModel ? "/v1/chat/completions" : "/v1/completions";
    
    if (isAzureServiceProvider) {
        if (deploymentName) {
            apiUrlPath = `/openai/deployments/${deploymentName}`;
            apiUrlPath += isChatGPTModel ? "/chat/completions?api-version=2023-03-15-preview" : "/completions?api-version=2022-12-01";
        } else {
            query.onCompletion({
                error: {
                    type: "secretKey",
                    message: "配置错误 - 未填写 Deployment Name",
                    addtion: "请在插件配置中填写 Deployment Name",
                },
            });
        } 
    }

    const header = buildHeader(isAzureServiceProvider, apiKey);
    const body = buildRequestBody(model, isChatGPTModel, query);

    (async () => {
        const result = await $http.request({
            method: "POST",
            url: modifiedApiUrl + apiUrlPath,
            header,
            body,
        });

        if (result.error) {
            handleError(query, result);
        } else {
            handleResponse(isChatGPTModel, query, result);
        }
    })().catch((err) => {
        query.onCompletion({
            error: {
                type: err._type || "unknown",
                message: err._message || "未知错误",
                addtion: err._addition,
            },
        });
    });
}

function supportLanguages() {
    return lang.supportLanguages.map(([standardLang]) => standardLang);
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
