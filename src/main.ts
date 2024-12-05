import { supportLanguageList } from "./lang";
import type { ServiceAdapter, ServiceProvider } from "./types";
import type {
  HttpResponse,
  PluginValidate,
  ServiceError,
  TextTranslate,
  TextTranslateQuery
} from "@bob-translate/types";
import {
  getApiKey,
  handleGeneralError,
  handleValidateError,
} from "./utils";
import { getServiceAdapter } from "./adapter";
import { ensureHttpsAndNoTrailingSlash } from "./utils";

const validatePluginConfig = (): ServiceError | null => {
  const { apiKeys, apiUrl, customModel, model, serviceProvider } = $option;

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
        addition: "Azure OpenAI 的 API URL 格式应为：https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION",
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

const handleGeneralResponse = (
  query: TextTranslateQuery,
  result: HttpResponse<any>,
  adapter: ServiceAdapter
) => {
  try {
    const text = adapter.parseResponse(result);
    query.onCompletion({
      result: {
        from: query.detectFrom,
        to: query.detectTo,
        toParagraphs: text.split("\n"),
      },
    });
  } catch (error) {
    handleGeneralError(query, {
      type: "api",
      message: `接口未返回结果`,
      addition: JSON.stringify(result),
    });
  }
}

const translate: TextTranslate = (query) => {
  const {
    apiKeys,
    apiUrl,
    serviceProvider,
    stream,
  } = $option;

  const serviceAdapter = getServiceAdapter(serviceProvider as ServiceProvider);
  const apiKey = getApiKey(apiKeys);

  const error = validatePluginConfig();

  if (error) {
    handleGeneralError(query, error);
    return;
  }

  const textGenerationUrl = serviceAdapter.getTextGenerationUrl(ensureHttpsAndNoTrailingSlash(apiUrl));
  const header = serviceAdapter.buildHeaders(apiKey);
  const body = serviceAdapter.buildRequestBody(query);

  let targetText = "";
  (async () => {
    if (stream === "enable") {
      await $http.streamRequest({
        method: "POST",
        url: textGenerationUrl,
        header,
        body: {
          ...body as Record<string, unknown>,
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
            return;
          }

          if (!streamData.text) {
            return;
          }

          targetText = serviceAdapter.handleStream(
            { text: streamData.text },
            query,
            targetText
          );
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
        url: textGenerationUrl,
        header,
        body: body as Record<string, unknown>,
      });

      if (result.error) {
        handleGeneralError(query, result);
      } else {
        handleGeneralResponse(query, result, serviceAdapter);
      }
    }
  })().catch((error) => {
    handleGeneralError(query, error);
  });
}

const pluginValidate: PluginValidate = (completion) => {
  const { apiKeys, apiUrl, serviceProvider } = $option;
  const apiKey = getApiKey(apiKeys);
  const pluginConfigError = validatePluginConfig();
  const serviceAdapter = getServiceAdapter(serviceProvider as ServiceProvider);

  if (pluginConfigError) {
    handleValidateError(completion, pluginConfigError);
    return;
  }

  serviceAdapter.testApiConnection(apiKey, ensureHttpsAndNoTrailingSlash(apiUrl), completion).catch((error) => {
    handleValidateError(completion, error);
  });
}

const pluginTimeoutInterval = () => 60;

const supportLanguages = () => supportLanguageList.map(([standardLang]) => standardLang);

export {
  pluginTimeoutInterval,
  pluginValidate,
  supportLanguages,
  translate,
}