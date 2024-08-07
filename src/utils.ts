import { HTTP_ERROR_CODES } from "./const";
import { BobHttpResponse, BobServiceError, BobTranslateQuery, BobValidateCompletion } from "./types";


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
  query: BobTranslateQuery,
  error: BobServiceError | BobHttpResponse
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
  completion: BobValidateCompletion,
  error: BobServiceError
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
  query: BobTranslateQuery
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