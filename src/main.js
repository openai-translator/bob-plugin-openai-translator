var items = [
    ["auto", "auto"],
    ["zh-Hans", "zh"],
    ["zh-Hant", "zh"],
    ["en", "en"],
];

var langMap = new Map(items);
var langMapReverse = new Map(
    items.map(([standardLang, lang]) => [lang, standardLang])
);

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}

function translate(query, completion) {
    const api_keys = $option.api_keys.split(",").map((key) => key.trim());
    const api_key = api_keys[Math.floor(Math.random() * api_keys.length)];
    const header = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + api_key,
    };
    const body = {
        model: $option.model,
        prompt: `translate to ${query.detectTo}:${query.text}`,
        temperature: 0,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    };
    (async () => {
        const resp = await $http.request({
            method: "POST",
            url: "https://api.openai.com/v1/completions",
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
                    addtion: JSON.stringify(resp),
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
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: choices[0].text.trim().split("\n"),
                },
            });
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || "unknown",
                message: err._message || "未知错误",
                addtion: err._addtion,
            },
        });
    });
}
