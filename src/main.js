var lang = require("./lang.js");

function supportLanguages() {
    return lang.supportLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
    const ChatGPTModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-0301"];
    const api_keys = $option.api_keys.split(",").map((key) => key.trim());
    const api_key = api_keys[Math.floor(Math.random() * api_keys.length)];
    const header = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
    };
    let systemPrompt =
        "You are a translation engine that can only translate text and cannot interpret it.";
    let userPrompt = `translate from ${lang.langMap.get(query.detectFrom) || query.detectFrom
        } to ${lang.langMap.get(query.detectTo) || query.detectTo}`;
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
    const body = {
        model: $option.model,
        temperature: 0,
        max_tokens: Number($option.max_tokens),
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    };
    userPrompt = `${userPrompt}:\n\n"${query.text}" =>`;
    const isChatGPTModel = ChatGPTModels.indexOf($option.model) > -1;
    if (isChatGPTModel) {
        body.messages = [
            {
                role: "system",
                content: systemPrompt,
            },
            { role: "user", content: userPrompt },
        ];
    } else {
        body.prompt = userPrompt;
    }
    (async () => {
        const resp = await $http.request({
            method: "POST",
            url:
                $option.api_url +
                (isChatGPTModel ? "/v1/chat/completions" : "/v1/completions"),
            header,
            body,
        });

        if (resp.error) {
            const { statusCode } = resp.response;
            let reason;
            if (statusCode >= 400 && statusCode < 500) {
                reason = "param";
            } else {
                reason = "api";
            }
            completion({
                error: {
                    type: reason,
                    message: `接口响应错误 - ${resp.data.error.message}`,
                    addition: JSON.stringify(resp),
                },
            });
        } else {
            const { choices } = resp.data;
            if (!choices || choices.length === 0) {
                completion({
                    error: {
                        type: "api",
                        message: "接口未返回结果",
                    },
                });
                return;
            }
            if (isChatGPTModel) {
                targetTxt = choices[0].message.content.trim();
            } else {
                targetTxt = choices[0].text.trim();
            }

            if (targetTxt.startsWith('"') || targetTxt.startsWith("「")) {
                targetTxt = targetTxt.slice(1);
            }
            if (targetTxt.endsWith('"') || targetTxt.endsWith("」")) {
                targetTxt = targetTxt.slice(0, -1);
            }

            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: targetTxt.split("\n"),
                },
            });
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
