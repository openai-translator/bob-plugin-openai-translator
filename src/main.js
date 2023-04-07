var lang = require("./lang.js");
var ChatGPTModels = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301",
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-32k",
    "gpt-4-32k-0314",
];

function supportLanguages() {
    return lang.supportLanguages.map(([standardLang]) => standardLang);
}

function buildHeader(isAzureServiceProvider, apiKey) {
    return {
        "Content-Type": "application/json",
        [isAzureServiceProvider ? "api-key" : "Authorization"]: isAzureServiceProvider ? apiKey : `Bearer ${apiKey}`
    };
}

function generatePrompts(query) {
    let systemPrompt = "You are a translation engine that can only translate text and cannot interpret it.";
    let userPrompt = `translate from ${lang.langMap.get(query.detectFrom) || query.detectFrom} to ${lang.langMap.get(query.detectTo) || query.detectTo}`;

    if (query.detectTo === "wyw" || query.detectTo === "yue") {
        userPrompt = `翻译成${lang.langMap.get(query.detectTo) || query.detectTo}`;
    }

    if (
        query.detectFrom === "wyw" ||
        query.detectFrom === "zh-Hans" ||
        query.detectFrom === "zh-Hant"
    ) {
        if (query.detectTo === "zh-Hant") {
            userPrompt = "翻译成繁体白话文";
        } else if (query.detectTo === "zh-Hans") {
            userPrompt = "翻译成简体白话文";
        } else if (query.detectTo === "yue") {
            userPrompt = "翻译成粤语白话文";
        }
    }
    if (query.detectFrom === query.detectTo) {
        systemPrompt =
            "You are a text embellisher, you can only embellish the text, don't interpret it.";
        if (query.detectTo === "zh-Hant" || query.detectTo === "zh-Hans") {
            userPrompt = $option.prompt_zh || "润色此句";
        } else {
            userPrompt = $option.prompt_en ||"polish this sentence";
        }
    }

    userPrompt = `${userPrompt}
    Text:
    """
    ${query.text}
    """
    `

    return { systemPrompt, userPrompt };
}

function buildRequestBody(model, isChatGPTModel, query) {
    const { systemPrompt, userPrompt } = generatePrompts(query);
    const standardBody = {
        model,
        temperature: 0,
        max_tokens: Number($option.max_tokens),
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    };
    if (isChatGPTModel) {
        return {
            ...standardBody,
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
        prompt: userPrompt,
    };
}

function handleError(completion, result) {
    const { statusCode } = result.response;
    const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
    completion({
        error: {
            type: reason,
            message: `接口响应错误 - ${result.data.error.message}`,
            addition: JSON.stringify(result),
        },
    });
}

function handleResponse(completion, isChatGPTModel, query, result) {
    const { choices } = result.data;

    if (!choices || choices.length === 0) {
        completion({
            error: {
                type: "api",
                message: "接口未返回结果",
            },
        });
        return;
    }

    let targetText = (isChatGPTModel ? choices[0].message.content : choices[0].text).trim();

    if (targetText.startsWith('"') || targetText.startsWith("「")) {
        targetText = targetText.slice(1);
    }
    if (targetText.endsWith('"') || targetText.endsWith("」")) {
        targetText = targetText.slice(0, -1);
    }

    completion({
        result: {
            from: query.detectFrom,
            to: query.detectTo,
            toParagraphs: targetText.split("\n"),
        },
    });
}

function translate(query, completion) {
    if (!lang.langMap.get(query.detectTo)) {
        completion({
            error: {
                type: "unsupportLanguage",
                message: "不支持该语种",
            },
        });
    }

    const { model, apiKeys, apiUrl, deploymentName } = $option;

    const apiKeySelection = apiKeys.split(",").map(key => key.trim());
    const apiKey = apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
    
    const isChatGPTModel = ChatGPTModels.includes(model);
    const isAzureServiceProvider = apiUrl.includes("openai.azure.com");
    let apiUrlPath = isChatGPTModel ? "/v1/chat/completions" : "/v1/completions";
    
    if (isAzureServiceProvider) {
        if (deploymentName) {
            apiUrlPath = `/openai/deployments/${deploymentName}`;
            apiUrlPath += isChatGPTModel ? '/chat/completions?api-version=2023-03-15-preview' : '/completions?api-version=2022-12-01';
        } else {
            completion({
                error: {
                    type: "secretKey",
                    message: `配置错误 - 未填写 Deployment Name`,
                },
            });
        } 
    }

    const header = buildHeader(isAzureServiceProvider, apiKey);
    const body = buildRequestBody(model, isChatGPTModel, query);

    (async () => {
        const result = await $http.request({
            method: "POST",
            url: apiUrl + apiUrlPath,
            header,
            body,
        });

        if (result.error) {
            handleError(result);
        } else {
            handleResponse(completion, isChatGPTModel, query, result);
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || "unknown",
                message: err._message || "未知错误",
                addition: err._addition,
            },
        });
    });
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
