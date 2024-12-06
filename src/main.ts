import { supportLanguageList } from "./lang";
import type { ServiceProvider } from "./types";
import type {
  PluginValidate,
  ServiceError,
  TextTranslate
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

  if (["azure-openai", "openai-compatible"].includes(serviceProvider) && !apiUrl) {
    return {
      type: "param",
      message: "配置错误 - 请填写 API URL",
      addition: "请在插件配置中填写有效的 API URL",
      troubleshootingLink: "https://github.com/openai-translator/bob-plugin-openai-translator/blob/main/docs/configuration_manual_CN.md#api-url"
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
      message: "配置错误 - 请确保你在插件配置中填入了正确的自定义模型名称",
      addition: "请在插件配置中填写自定义模型名称",
    };
  }

  return null;
}

export const translate: TextTranslate = (query) => {
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

  serviceAdapter.translate(
    query,
    apiKey,
    ensureHttpsAndNoTrailingSlash(apiUrl),
    stream === "enable"
  ).catch((error: unknown) => {
    handleGeneralError(query, error);
  });
}

export const pluginValidate: PluginValidate = (completion) => {
  const { apiKeys, apiUrl, serviceProvider } = $option;
  const apiKey = getApiKey(apiKeys);
  const pluginConfigError = validatePluginConfig();
  const serviceAdapter = getServiceAdapter(serviceProvider as ServiceProvider);

  if (pluginConfigError) {
    handleValidateError(completion, pluginConfigError);
    return;
  }

  serviceAdapter.testApiConnection(
    apiKey,
    ensureHttpsAndNoTrailingSlash(apiUrl),
    completion
  ).catch((error: unknown) => {
    $log.error(`pluginValidate error: ${JSON.stringify(error)}`);
    handleValidateError(completion, error);
  });
}

export const pluginTimeoutInterval = () => 60;

export const supportLanguages = () => supportLanguageList.map(([standardLang]) => standardLang);
