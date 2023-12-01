var HttpErrorCodes = require("./const.js").HttpErrorCodes;

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
 * @param {string}  url
 * @returns {string} 
*/
function ensureHttpsAndNoTrailingSlash(url) {
  const hasProtocol = /^[a-z]+:\/\//i.test(url);
  const modifiedUrl = hasProtocol ? url : 'https://' + url;

  return modifiedUrl.endsWith('/') ? modifiedUrl.slice(0, -1) : modifiedUrl;
}

/**
 * @param {string} apiKeys
 * @returns {string}
*/
function getApiKey(apiKeys) {
  const trimmedApiKeys = apiKeys.endsWith(",") ? apiKeys.slice(0, -1) : apiKeys;
  const apiKeySelection = trimmedApiKeys.split(",").map(key => key.trim());
  return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
}

/**
 * @param {Bob.TranslateQuery} query
 * @param {Bob.ServiceError | Bob.HttpResponse} error
 */
function handleGeneralError(query, error) {
  if ('response' in error) {
      // 处理 HTTP 响应错误
      const { statusCode } = error.response;
      const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
      query.onCompletion({
          error: {
              type: reason,
              message: `接口响应错误 - ${HttpErrorCodes[statusCode]}`,
              addition: `${JSON.stringify(error)}`,
          },
      });
  } else {
      // 处理一般错误
      query.onCompletion({
          error: {
              ...error,
              type: error.type || "unknown",
              message: error.message || "Unknown error",
          },
      });
  }
}


/**
 * @param {Bob.ValidateCompletion} completion
 * @param {Bob.ServiceError} error
 */
function handleValidateError(completion, error) {
  completion({
      result: false,
      error: {
        ...error,
        type: error.type || 'unknown',
        message: error.message || "Unknown error",
    }
  });
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

exports.buildHeader = buildHeader;
exports.ensureHttpsAndNoTrailingSlash = ensureHttpsAndNoTrailingSlash;
exports.getApiKey = getApiKey;
exports.handleGeneralError = handleGeneralError;
exports.handleValidateError = handleValidateError;
exports.replacePromptKeywords = replacePromptKeywords;