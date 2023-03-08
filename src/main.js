var lang = require("./lang.js");

function supportLanguages() {
    return lang.supportLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
    this.query = query;
    this.completion = completion;
    dispatch()();
}

function dispatch() {
    const query = this.query;

    switch ($option.purpose) {
        case "translate":
            return doTranslate;
        case "polish":
            return doPolish;
        case "dictionary":
            return doLookupDictionary;
        case "guessWord":
            return doGuessWord;
        case "compareWord":
            return doCompareWord;
        case "chat":
            return doChat;
    }

    // Auto mode
    // Some modes need special triggle
    if (query.text.startsWith("$guess\n")) {
        return doGuessWord;
    }
    if (query.text.startsWith("$chat\n")) {
        return doChat;
    }
    if (query.text.startsWith("$compare\n")) {
        return doCompareWord;
    }
    if (query.detectFrom === query.detectTo) {
        if (query.detectFrom === "en") {
            // English to English, use dictionary mode for short words
            if (query.text.split(" ").length <= 3) {
                return doLookupDictionary;
            }
        }
        return doPolish;
    } else {
        return doTranslate;
    }
}

function doTranslate() {
    $log.info("Translate");
    let query = this.query;

    let prompt = `Translate from ${lang.langMap.get(query.detectFrom) || query.detectFrom
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
    query.text = `Given paragraph:\n"${query.text}"`
    sendRequest(prompt, query, 1, 1, fillTranslateResult)
}

function fillTranslateResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    let text = rawResult.result.raw.replace("Translation:", "");
    let paras = text.split("\n");
    for (let i = 0; i < paras.length; i++) {
        paras[i] = trimResultCommon(paras[i]);
    }

    rawResult.result.toParagraphs = paras;
    this.completion(rawResult);
}

function doPolish() {
    $log.info("Polish");
    let query = this.query;

    const detailedPolishingMode = $option.polishMode !== "Simple";
    let prompt = "";
    switch (query.detectFrom) {
        case "zh-Hant":
        case "zh-Hans":
            prompt = "润色此句\n";
            if (detailedPolishingMode) {
                prompt += "- 列出更改及简要解释为什么这么修改\n";
            }
            break;
        case "ja":
            prompt = "この文章を装飾する\n";
            if (detailedPolishingMode) {
                prompt += "- 変更点をリストアップし、なぜそのように変更したかを簡単に説明することに注意してください\n";
            }
            break;
        case "ru":
            prompt =
                "Переформулируйте следующие предложения, чтобы они стали более ясными, краткими и связными\n";
            if (detailedPolishingMode) {
                prompt = "- Пожалуйста, обратите внимание на необходимость перечисления изменений и краткого объяснения причин таких изменений\n";
            }
            break;
        case "wyw":
            prompt = "润色此句古文\n";
            if (detailedPolishingMode) {
                prompt = "- 列出更改及简要解释为什么这么修改\n";
            }
            break;
        case "yue":
            prompt = "潤色呢句粵語\n";
            if (detailedPolishingMode) {
                prompt = "- 記住要列出修改嘅內容同簡單解釋下點解要做呢啲更改\n";
            }
            break;
        case "en":
        default:
            prompt = "Help users fix grammar mistakes, typos, and improve their writing skills\n" +
                "- Revise given paragraph to make it clearer, concise, and coherent\n";
            if ($option.polishOutputNum === "onlyOne") {
                prompt += "- Provide only one corrected version\n";
            } else {
                prompt += "- Provide more than three corrected versions\n";
            }

            if ($option.polishMode === "Detailed" || $option.polishMode === "Simple") {
                prompt += "- Only fix mistake, don't add addition contents\n"
            } else if ($option.polishMode === "Enrich") {
                prompt += "- Add more contents to enrich the given paragraph and make it more comprehensive\n"
            }

            if (detailedPolishingMode) {
                prompt += "- Explain your modifications one by one for each version separately in detail\n";
            }
            break;
    }
    query.text = `Given paragraph:\n"${query.text}"`
    sendRequest(prompt, query, 1.2, 0.6, fillPolishResult)
}

function fillPolishResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    let text = rawResult.result.raw.replace("Corrected version:", "");
    text = text.replace("Revised paragraph:", "");
    let paras = text.split("\n");
    let tmp = "";
    for (let i = 0; i < paras.length; i++) {
        paras[i] = trimResultCommon(paras[i]);
        tmp += paras[i];
        tmp += "\n";
    }


    rawResult.result.toParagraphs = [tmp];
    this.completion(rawResult);
}

function doLookupDictionary() {
    $log.info("Dictionary");
    let query = this.query;

    let prompt = "Origanize the answer to the following instructs in structural json format.\n" +
        "0. The correct spelling of the given word, if there are any spelling errors in the given word, correct them; json key 'word'\n" +
        "1. Provide a detailed dictionary definition of the given word in English, including its part of speech; json key 'definition' and this is an array, " +
        "each part of speech definition is an array item, with key 'meaning', 'pos' and 'translation'. the 'translation' contains the simplified Chinese translation.\n" +
        "2. IPA pronunciation of the given word; json key 'pronunciation'\n" +
        "3. Explain when and how to use the given word; json key 'usage'\n" +
        "4. Provide some example of it's usage; json key 'examples'\n" +
        "5. Frequency of word usage; json key 'frequency'\n" +
        "6. Perceived word difficulty; json key 'level'\n" +
        "7. List all synonyms and antonyms of the given word; json key 'synonyms' and 'antonyms'\n" +
        "8. List all derivations of the given word, with part of speech, in an array; json key 'derivations'\n" +
        "Note: a) part of speech should use standard abbreviation, like n, v, adj, adv, pro, prep, conj, int; " +
        "b) output json must in valid json format\n"

    // Note: use lower case
    query.text = `Given word:\n"${query.text.toLowerCase()}"`
    sendRequest(prompt, query, 0.1, 0.1, fillDictionaryResult)
}

function fillDictionaryResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    // ChatGPT output json may have invalid ','
    rawResult.result.raw = rawResult.result.raw.replace(/,\s*]/, "]");

    let rawDictObj = null;
    try {
        rawDictObj = JSON.parse(rawResult.result.raw);
    } catch (e) {
        $log.error("Parse dictionary json error. " + rawResult.result.raw)
        rawResult.result.toParagraphs = trimResultCommon(rawResult.result.raw).split("\n");
        this.completion(rawResult);
        return;
    }

    let retDictObj = {
        word: rawDictObj.word,
        phonetics: [{ type: "us", }],
        parts: [],
        exchanges: [{
            name: "Synonyms",
            words: [],
        },
        {
            name: "Antonyms",
            words: []
        }],
        relatedWordParts: [],
        additions: [{
            name: "Usage",
            value: ""
        },
        {
            name: "Examples",
            value: ""
        },
        {
            name: "Frenquency & Level",
            value: ""
        }
        ]
    };

    if (rawDictObj.pronunciation.startsWith("/")) {
        retDictObj.phonetics[0].value = rawDictObj.pronunciation.slice(1, -1);
    } else {
        retDictObj.phonetics[0].value = rawDictObj.pronunciation;
    }

    for (const def of rawDictObj.definition) {
        let meanings = def.meaning.split(";");
        meanings = meanings.concat(def.translation.split("；"));

        retDictObj.parts.push({
            part: def.pos,
            means: meanings
        })
    }

    for (const word of rawDictObj.synonyms) {
        retDictObj.exchanges[0].words.push(word);
    }
    for (const word of rawDictObj.antonyms) {
        retDictObj.exchanges[1].words.push(word);
    }

    let relatedDic = {};
    for (const word of rawDictObj.derivations) {
        if (word.pos in relatedDic) {
            relatedDic[word.pos].push(word.word);
        } else {
            relatedDic[word.pos] = [word.word]
        }
    }
    for (const pos in relatedDic) {
        let words = [];
        for (const w of relatedDic[pos]) {
            words.push({ word: w });
        }
        retDictObj.relatedWordParts.push({
            part: pos,
            words: words
        });
    }

    retDictObj.additions[0].value = rawDictObj.usage;
    let exampleFullStr = "";
    for (const s of rawDictObj.examples) {
        exampleFullStr = exampleFullStr + "- " + s + "\n";
    }
    retDictObj.additions[1].value = exampleFullStr;
    retDictObj.additions[2].value = rawDictObj.frequency + "    " + rawDictObj.level;

    rawResult.result.toDict = retDictObj;
    // Ref: https://github.com/ripperhe/Bob/issues/470
    rawResult.result.toParagraphs = ["----------------"];
    this.completion(rawResult);
}

function doGuessWord() {
    $log.info("Guess Word");
    let query = this.query;

    let prompt = "Search for correct English words in the dictionary and provide their definitions depends on user given descriptions\n" +
        "- If the descriptions is not in English, translate it to English first\n" +
        "- Provide all possible words\n" +
        "- Show only valid and correctly spelled English words\n" +
        "- Provide the definition and usage of these word in detail\n" +
        "- Provide more than three example sentences of these words\n" +
        "- Explain your answer in detail\n";

    let inputs = query.text.split("\n");
    // skip first line
    let index = 1;
    while (inputs[index] === "") {
        index += 1;
    }

    query.text = `Description: "${inputs[index]}"\n`
    index += 1
    while (inputs[index] === "" && index < inputs.length) {
        index += 1;
    }
    if (index < inputs.length) {
        let m = inputs[index].trim().match(/^([a-z]+)\*\*\*/);
        if (m) {
            query.text += `Starting letters: "${m[1]}"\n`;
        }
        m = inputs[index].trim().match(/\*\*\*([a-z]+)\*\*\*/);
        if (m) {
            query.text += `Contains letters: "${m[1]}"\n`;
        }
        m = inputs[index].trim().match(/\*\*\*([a-z]+)$/);
        if (m) {
            query.text += `Ending letters: "${m[1]}"\n`;
        }
    }
    sendRequest(prompt, query, 0.5, 0.2, fillGuessWordResult)
}

function fillGuessWordResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    let paras = rawResult.result.raw.split("\n");
    for (let i = 0; i < paras.length; i++) {
        paras[i] = trimResultCommon(paras[i]);
    }

    rawResult.result.toParagraphs = paras;
    this.completion(rawResult);
}

function doCompareWord() {
    $log.info("Compare Word");
    let query = this.query;

    let prompt = "Explain the difference betweeen given words and when to use each word with examples.\n" +
        `Answer the question in ${lang.langMap.get(query.detectTo) || query.detectTo}`;

    let inputs = query.text.split("\n");
    query.text = "Given Words: \n";
    // skip first line
    for (let index = 1; index < inputs.length; ++index) {
        if (inputs[index] === "") {
            continue;
        }
        query.text += `${inputs[index]}\n`;
    }

    sendRequest(prompt, query, 0.3, 0.1, fillCompareWordResult)
}

function fillCompareWordResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    let paras = rawResult.result.raw.split("\n");
    for (let i = 0; i < paras.length; i++) {
        paras[i] = trimResultCommon(paras[i]);
    }

    rawResult.result.toParagraphs = paras;
    this.completion(rawResult);
}

function doChat() {
    $log.info("Chat");
    let query = this.query;

    let prompt = "You are an AI assistant that answers users' questions.\n" +
        `Answer the question in ${lang.langMap.get(query.detectTo) || query.detectTo}`;
    query.text = query.text.replace("$chat\n", "");
    sendRequest(prompt, query, 1, 1, fillChatResult)
}

function fillChatResult(rawResult) {
    if (!("result" in rawResult)) {
        this.completion(rawResult);
        return;
    }

    rawResult.result.toParagraphs = rawResult.result.raw.split("\n");
    this.completion(rawResult);
}

function sendRequest(prompt, query, frequencyPenalty, presencePenalty, callback) {
    const ChatGPTModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-0301"];
    const isChatGPTModel = ChatGPTModels.indexOf($option.model) > -1;
    const api_keys = $option.api_keys.split(",").map((key) => key.trim());
    const api_key = api_keys[Math.floor(Math.random() * api_keys.length)];
    const header = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
    };
    const body = {
        model: $option.model,
        temperature: 0,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
    };
    if (isChatGPTModel) {
        body.messages = [
            { role: "system", content: prompt },
            { role: "user", content: `${query.text}` },
        ];
    } else {
        body.prompt = `${prompt}\n\n${query.text}`;
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
            callback({
                error: {
                    type: reason,
                    message: `接口响应错误 - ${resp.data.error.message}`,
                    addition: JSON.stringify(resp),
                },
            });
        } else {
            const { choices } = resp.data;
            if (!choices || choices.length === 0) {
                callback({
                    error: {
                        type: "api",
                        message: "接口未返回结果",
                    },
                });
                return;
            }
            if (isChatGPTModel) {
                targetTxt = choices[0].message.content;
            } else {
                targetTxt = choices[0].text;
            }
            $log.info("OpenAI response success!");

            callback({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    raw: targetTxt,
                },
            });
        }
    })().catch((err) => {
        callback({
            error: {
                type: err._type || "unknown",
                message: err._message || "未知错误",
                addition: err._addition,
            },
        });
    });
}

function trimResultCommon(str) {
    str = str.trim();
    if (str.startsWith('"') || str.startsWith("「")) {
        str = str.slice(1);
    }
    if (str.endsWith('"') || str.endsWith("」")) {
        str = str.slice(0, -1);
    }
    return str.trim();
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
