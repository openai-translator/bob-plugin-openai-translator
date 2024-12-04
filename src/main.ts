import { SYSTEM_PROMPT } from "./const";
import { langMap, supportLanguageList } from "./lang";
import type { ChatCompletion, ModelList, ServiceProvider } from "./types";
import type {
  HttpResponse,
  PluginValidate,
  ServiceError,
  TextTranslate,
  TextTranslateQuery
} from "@bob-translate/types";
import {
  buildHeader,
  ensureHttpsAndNoTrailingSlash,
  getApiKey,
  handleGeneralError,
  handleValidateError,
  replacePromptKeywords
} from "./utils";

function validateConfig(
  serviceProvider: ServiceProvider,
  apiKeys?: string,
  apiUrl?: string,
  model?: string,
  customModel?: string
): ServiceError | null {

  if (serviceProvider !== 'openai' && !apiUrl) {
    return {
      type: "param",
      message: "配置错误 - 请填写 API URL",
      addition: "请在插件配置中填写完整的 API URL"
    };
  }

  if (serviceProvider === 'azure-openai' && apiUrl) {
    const parts = {
      domain: /^https:\/\/[^\/]+\.openai\.azure\.com/,
      path: /\/openai\/deployments\/[^\/]+\/chat\/completions/,
      version: /\?api-version=\d{4}-\d{2}-\d{2}(?:-preview)?$/
    };

    const isValidUrl = Object.values(parts).every(pattern => pattern.test(apiUrl));
    if (!isValidUrl) {
      return {
        type: "param",
        message: "配置错误 - API URL 格式不正确",
        addition: "Azure OpenAI 的 API URL 格式应为：https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION",
        troubleshootingLink: "https://bobtranslate.com/service/translate/azureopenai.html"
      };
    }
  }

  if (!apiKeys) {
    return {
      type: "secretKey",
      message: "配置错误 - 请确保您在插件配置中填入了正确的 API Keys",
      addition: "请在插件配置中填写 API Keys",
    };
  }

  if (model === "custom" && !customModel) {
    return {
      type: "param",
      message: "配置错误 - 请确保您在插件配置中填入了正确的自定义模型名称",
      addition: "请在插件配置中填写自定义模型名称",
    };
  }

  return null;
}

function getServiceConfig(serviceProvider: ServiceProvider, apiUrl?: string) {
  switch (serviceProvider) {
    case 'azure-openai':
      return {
        chatCompletionsUrl: apiUrl!,
        isAzureOpenAi: true,
        validateUrl: apiUrl!,
      };
    case 'custom':
      return {
        chatCompletionsUrl: apiUrl!,
        isAzureOpenAi: false,
        validateUrl: apiUrl!.replace(/\/chat\/completions$/, '/models'),
      };
    default: // openai
      const baseUrl = ensureHttpsAndNoTrailingSlash(apiUrl || "https://api.openai.com");
      return {
        chatCompletionsUrl: `${baseUrl}/v1/chat/completions`,
        isAzureOpenAi: false,
        validateUrl: `${baseUrl}/v1/models`,
      };
  }
}

const isServiceError = (error: unknown): error is ServiceError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ServiceError).message === 'string'
  );
}

const generatePrompts = (query: TextTranslateQuery): {
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

const buildRequestBody = (model: string, query: TextTranslateQuery) => {
  let { customSystemPrompt, customUserPrompt, temperature } = $option;
  const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query);

  customSystemPrompt = replacePromptKeywords(customSystemPrompt, query);
  customUserPrompt = replacePromptKeywords(customUserPrompt, query);

  const systemPrompt = customSystemPrompt || generatedSystemPrompt;
  const userPrompt = customUserPrompt || generatedUserPrompt;

  const modelTemperature = Number(temperature ?? 0.2);

  const standardBody = {
    model: model,
    temperature: modelTemperature,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
  };

  return {
    ...standardBody,
    model: model,
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

const handleStreamResponse = (
  query: TextTranslateQuery,
  targetText: string,
  textFromResponse: string
) => {
  if (textFromResponse !== '[DONE]') {
    try {
      const dataObj = JSON.parse(textFromResponse);
      // https://github.com/openai/openai-node/blob/master/src/resources/chat/completions#L190
      const { choices } = dataObj;
      const delta = choices[0]?.delta?.content;
      if (delta) {
        targetText += delta;
        query.onStream({
          result: {
            from: query.detectFrom,
            to: query.detectTo,
            toParagraphs: [targetText],
          },
        });
      }
    } catch (error) {
      if (isServiceError(error)) {
        handleGeneralError(query, {
          type: error.type || 'param',
          message: error.message || 'Failed to parse JSON',
          addition: error.addition,
        });
      } else {
        handleGeneralError(query, {
          type: 'param',
          message: 'An unknown error occurred',
        });
      }
    }
  }
  return targetText;
}

const handleGeneralResponse = (
  query: TextTranslateQuery,
  result: HttpResponse<ChatCompletion>
) => {
  const { choices } = result.data as ChatCompletion;

  if (!choices || choices.length === 0) {
    handleGeneralError(query, {
      type: "api",
      message: "接口未返回结果",
      addition: JSON.stringify(result),
    });
    return;
  }

  let targetText = choices[0].message.content?.trim();

  // 使用正则表达式删除字符串开头和结尾的特殊字符
  targetText = targetText?.replace(/^(『|「|"|“)|(』|」|"|”)$/g, "");

  // 判断并删除字符串末尾的 `" =>`
  if (targetText?.endsWith('" =>')) {
    targetText = targetText.slice(0, -4);
  }

  query.onCompletion({
    result: {
      from: query.detectFrom,
      to: query.detectTo,
      toParagraphs: targetText!.split("\n"),
    },
  });
}

const translate: TextTranslate = (query) => {
  const { apiKeys, apiUrl, customModel, model, serviceProvider, stream } = $option;

  const error = validateConfig(
    serviceProvider as ServiceProvider,
    apiKeys,
    apiUrl,
    model,
    customModel
  );

  if (error) {
    handleGeneralError(query, error);
    return;
  }

  const serviceConfig = getServiceConfig(serviceProvider as ServiceProvider, apiUrl);
  const { chatCompletionsUrl, isAzureOpenAi } = serviceConfig;

  const modelValue = model === "custom" ? customModel : model;
  const apiKey = getApiKey(apiKeys);
  const header = buildHeader(isAzureOpenAi, apiKey);
  const body = buildRequestBody(modelValue, query);

  let targetText = ""; // 初始化拼接结果变量
  let buffer = ""; // 新增 buffer 变量
  (async () => {
    if (stream === "enable") {
      await $http.streamRequest({
        method: "POST",
        url: chatCompletionsUrl,
        header,
        body: {
          ...body,
          stream: true,
        },
        cancelSignal: query.cancelSignal,
        streamHandler: (streamData) => {
          if (streamData.text?.includes("Invalid token")) {
            handleGeneralError(query, {
              type: "secretKey",
              message: "配置错误 - 请确保您在插件配置中填入了正确的 API Keys",
              addition: "请在插件配置中填写正确的 API Keys",
              troubleshootingLink: "https://bobtranslate.com/service/translate/openai.html"
            });
          } else if (streamData.text !== undefined) {
            // 将新的数据添加到缓冲变量中
            buffer += streamData.text;
            // 检查缓冲变量是否包含一个完整的消息
            while (true) {
              const match = buffer.match(/data: (.*?})\n/);
              if (match) {
                // 如果是一个完整的消息，处理它并从缓冲变量中移除
                const textFromResponse = match[1].trim();
                targetText = handleStreamResponse(query, targetText, textFromResponse);
                buffer = buffer.slice(match[0].length);
              } else {
                // 如果没有完整的消息，等待更多的数据
                break;
              }
            }
          }
        },
        handler: (result) => {
          if (result.response.statusCode >= 400) {
            handleGeneralError(query, result);
          } else {
            query.onCompletion({
              result: {
                from: query.detectFrom,
                to: query.detectTo,
                toParagraphs: [targetText],
              },
            });
          }
        }
      });
    } else {
      const result = await $http.request({
        method: "POST",
        url: chatCompletionsUrl,
        header,
        body,
      });

      if (result.error) {
        handleGeneralError(query, result);
      } else {
        handleGeneralResponse(query, result);
      }
    }
  })().catch((error) => {
    handleGeneralError(query, error);
  });
}

const pluginValidate: PluginValidate = (completion) => {
  const { apiKeys, apiUrl, customModel, model, serviceProvider } = $option;

  const error = validateConfig(
    serviceProvider as ServiceProvider,
    apiKeys,
    apiUrl,
    model,
    customModel
  );

  if (error) {
    handleValidateError(completion, error);
    return;
  }

  const serviceConfig = getServiceConfig(serviceProvider as ServiceProvider, apiUrl);
  const { isAzureOpenAi, validateUrl } = serviceConfig;
  const apiKey = getApiKey(apiKeys);
  const header = buildHeader(isAzureOpenAi, apiKey);

  (async () => {
    if (isAzureOpenAi) {
      $http.request({
        method: "POST",
        url: validateUrl,
        header: header,
        body: {
          "messages": [{
            "content": "You are a helpful assistant.",
            "role": "system",
          }, {
            "content": "Test connection.",
            "role": "user",
          }],
          max_tokens: 5
        },
        handler: function (resp) {
          const data = resp.data as {
            error: string;
          }
          if (data.error) {
            const { statusCode } = resp.response;
            const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
            handleValidateError(completion, {
              type: reason,
              message: data.error,
              troubleshootingLink: "https://bobtranslate.com/service/translate/azureopenai.html"
            });
            return;
          }
          if ((resp.data as ChatCompletion).choices.length > 0) {
            completion({
              result: true,
            })
          }
        }
      });
    } else {
      $http.request({
        method: "GET",
        url: validateUrl,
        header: header,
        handler: function (resp) {
          const data = resp.data as {
            error: string;
          }
          if (data.error) {
            const { statusCode } = resp.response;
            const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
            handleValidateError(completion, {
              type: reason,
              message: data.error,
              troubleshootingLink: "https://bobtranslate.com/service/translate/openai.html"
            });
            return;
          }
          const modelList = resp.data as ModelList;
          if (modelList.data?.length > 0) {
            completion({
              result: true,
            })
          }
        }
      });
    }
  })().catch((error) => {
    handleValidateError(completion, error);
  });
}

const pluginTimeoutInterval = () => 60;

function supportLanguages() {
  return supportLanguageList.map(([standardLang]) => standardLang);
}

export {
  pluginTimeoutInterval,
  pluginValidate,
  supportLanguages,
  translate,
}