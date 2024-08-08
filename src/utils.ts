import { HTTP_ERROR_CODES } from "./const";
import { HttpResponse } from "./types/http.type";
import type { ValidationCompletion } from "./types/plugin-validate.type";
import type { ServiceError } from "./types/service-error.type";
import type { TextTranslateQuery } from "./types/text-translate.type";


function buildHeader(isAzureServiceProvider: boolean, apiKey: string): {
  "Content-Type": string;
  "api-key"?: string;
  Authorization?: string;
} {
  return {
    "Content-Type": "application/json",
    [isAzureServiceProvider ? "api-key" : "Authorization"]:
      isAzureServiceProvider ? apiKey : `Bearer ${apiKey}`,
  };
}

function ensureHttpsAndNoTrailingSlash(url: string): string {
  const hasProtocol = /^[a-z]+:\/\//i.test(url);
  const modifiedUrl = hasProtocol ? url : "https://" + url;

  return modifiedUrl.endsWith("/") ? modifiedUrl.slice(0, -1) : modifiedUrl;
}

function getApiKey(apiKeys: string): string {
  const trimmedApiKeys = apiKeys.endsWith(",")
    ? apiKeys.slice(0, -1)
    : apiKeys;
  const apiKeySelection = trimmedApiKeys.split(",").map((key) => key.trim());
  return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
}

function handleGeneralError(
  query: TextTranslateQuery,
  error: ServiceError | HttpResponse
) {
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

function handleValidateError(
  completion: ValidationCompletion,
  error: ServiceError
) {
  completion({
    result: false,
    error: {
      ...error,
      type: error.type || "unknown",
      message: error.message || "Unknown error",
    },
  });
}

function replacePromptKeywords(
  prompt: string,
  query: TextTranslateQuery
): string {
  if (!prompt) return prompt;
  return prompt
    .replace("$text", query.text)
    .replace("$sourceLang", query.detectFrom)
    .replace("$targetLang", query.detectTo);
}

export {
  buildHeader,
  ensureHttpsAndNoTrailingSlash,
  getApiKey,
  handleGeneralError,
  handleValidateError,
  replacePromptKeywords,
};