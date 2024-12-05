import type {
  HttpResponse,
  ServiceError,
  TextTranslateQuery,
  ValidationCompletion
} from "@bob-translate/types";
import { HTTP_ERROR_CODES, SYSTEM_PROMPT } from "./const";
import { langMap } from "./lang";

export const ensureHttpsAndNoTrailingSlash = (url: string): string => {
  const hasProtocol = /^[a-z]+:\/\//i.test(url);
  const modifiedUrl = hasProtocol ? url : "https://" + url;

  return modifiedUrl.endsWith("/") ? modifiedUrl.slice(0, -1) : modifiedUrl;
}

export const getApiKey = (apiKeys: string): string => {
  const trimmedApiKeys = apiKeys.endsWith(",")
    ? apiKeys.slice(0, -1)
    : apiKeys;
  const apiKeySelection = trimmedApiKeys.split(",").map((key) => key.trim());
  return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
}

export const generatePrompts = (query: TextTranslateQuery): {
  generatedSystemPrompt: string,
  generatedUserPrompt: string
} => {
  let generatedSystemPrompt = null;
  const { detectFrom, detectTo } = query;
  const sourceLang = langMap.get(detectFrom) || detectFrom;
  const targetLang = langMap.get(detectTo) || detectTo;
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

  return {
    generatedSystemPrompt: generatedSystemPrompt ?? SYSTEM_PROMPT,
    generatedUserPrompt
  };
}

export const handleGeneralError = (
  query: TextTranslateQuery,
  error: ServiceError | HttpResponse
) => {
  if ("response" in error) {
    // Handle HTTP response error
    const { statusCode } = error.response;
    const reason = statusCode >= 400 && statusCode < 500 ? "param" : "api";
    query.onCompletion({
      error: {
        type: reason,
        message: `接口响应错误 - ${HTTP_ERROR_CODES[statusCode]}`,
        addition: `${JSON.stringify(error)}`,
      },
    });
  } else {
    // Handle general error
    query.onCompletion({
      error: {
        ...error,
        type: error.type || "unknown",
        message: error.message || "Unknown error",
      },
    });
  }
}

export const handleValidateError = (
  completion: ValidationCompletion,
  error: ServiceError
) => {
  completion({
    result: false,
    error: {
      ...error,
      type: error.type || "unknown",
      message: error.message || "Unknown error",
    },
  });
}

export const replacePromptKeywords = (
  prompt: string,
  query: TextTranslateQuery
): string => {
  if (!prompt) {
    return prompt;
  }

  return prompt
    .replace("$text", query.text)
    .replace("$sourceLang", query.detectFrom)
    .replace("$targetLang", query.detectTo);
}
