import type {
  HttpResponse,
  ServiceError,
  TextTranslateQuery,
  ValidationCompletion,
} from '@bob-translate/types';
import { langMap } from './lang';
import type { TypeCheckConfig } from './types';

const SYSTEM_PROMPT =
  'You are a translation engine that can only translate text and cannot interpret it.' as const;

export const createTypeGuard = <T>(config: TypeCheckConfig) => {
  return (value: unknown): value is T => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Object.entries(config).every(([key, check]) => {
      if (!(key in value)) {
        return check.optional ?? false;
      }

      const fieldValue = (value as Record<string, unknown>)[key];
      if (check.nullable && fieldValue === null) {
        return true;
      }

      return typeof fieldValue === check.type;
    });
  };
};

const hasServiceErrorShape = createTypeGuard<ServiceError>({
  type: { type: 'string' },
  message: { type: 'string' },
  addition: { type: 'string', optional: true },
  troubleshootingLink: { type: 'string', optional: true },
});

export const convertToServiceError = (
  error: unknown,
  defaultMessage = '未知错误',
): ServiceError => {
  const generalServiceError: ServiceError = {
    type: 'api',
    message: defaultMessage,
    addition: JSON.stringify(error),
  };

  if (!error || typeof error !== 'object') {
    return {
      ...generalServiceError,
      type: 'unknown',
    };
  }

  if (hasServiceErrorShape(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      ...generalServiceError,
      message: error.message,
    };
  }

  return generalServiceError;
};

export const ensureHttpsAndNoTrailingSlash = (url: string): string => {
  const hasProtocol = /^[a-z]+:\/\//i.test(url);
  const modifiedUrl = hasProtocol ? url : `https://${url}`;

  return modifiedUrl.endsWith('/') ? modifiedUrl.slice(0, -1) : modifiedUrl;
};

export const generatePrompts = (
  query: TextTranslateQuery,
): {
  generatedSystemPrompt: string;
  generatedUserPrompt: string;
} => {
  let generatedSystemPrompt = null;
  const { detectFrom, detectTo } = query;
  const sourceLang = langMap.get(detectFrom) || detectFrom;
  const targetLang = langMap.get(detectTo) || detectTo;
  let generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}`;

  if (detectTo === 'wyw' || detectTo === 'yue') {
    generatedUserPrompt = `翻译成${targetLang}`;
  }

  if (
    detectFrom === 'wyw' ||
    detectFrom === 'zh-Hans' ||
    detectFrom === 'zh-Hant'
  ) {
    if (detectTo === 'zh-Hant') {
      generatedUserPrompt = '翻译成繁体白话文';
    } else if (detectTo === 'zh-Hans') {
      generatedUserPrompt = '翻译成简体白话文';
    } else if (detectTo === 'yue') {
      generatedUserPrompt = '翻译成粤语白话文';
    }
  }
  if (detectFrom === detectTo) {
    generatedSystemPrompt =
      "You are a text embellisher, you can only embellish the text, don't interpret it.";
    if (detectTo === 'zh-Hant' || detectTo === 'zh-Hans') {
      generatedUserPrompt = '润色此句';
    } else {
      generatedUserPrompt = 'polish this sentence';
    }
  }

  generatedUserPrompt = `${generatedUserPrompt}:\n\n${query.text}`;

  return {
    generatedSystemPrompt: generatedSystemPrompt ?? SYSTEM_PROMPT,
    generatedUserPrompt,
  };
};

export const getApiKey = (apiKeys: string): string => {
  const trimmedApiKeys = apiKeys.endsWith(',') ? apiKeys.slice(0, -1) : apiKeys;
  const apiKeySelection = trimmedApiKeys.split(',').map((key) => key.trim());
  return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
};

export const handleGeneralError = (
  query: TextTranslateQuery,
  error: unknown | ServiceError | HttpResponse,
) => {
  if (error && typeof error === 'object' && 'response' in error) {
    // 如果是 HttpResponse，创建包含详细错误信息的 ServiceError
    const httpError = error as HttpResponse;
    const serviceError: ServiceError = {
      type: 'api',
      message: 'API 返回了错误响应',
      addition: JSON.stringify({
        status: httpError.response.statusCode,
        data: httpError.data,
      }),
    };
    query.onCompletion({ error: serviceError });
    return;
  }

  query.onCompletion({
    error: isServiceError(error) ? error : convertToServiceError(error),
  });
};

export const handleValidateError = (
  completion: ValidationCompletion,
  error: unknown,
) => {
  completion({
    result: false,
    error: isServiceError(error) ? error : convertToServiceError(error),
  });
};

export const isServiceError = createTypeGuard<ServiceError>({
  type: { type: 'string' },
  message: { type: 'string' },
});

export const replacePromptKeywords = (
  prompt: string,
  query: TextTranslateQuery,
): string => {
  if (!prompt) {
    return prompt;
  }

  return prompt
    .replace('$text', query.text)
    .replace('$sourceLang', query.detectFrom)
    .replace('$targetLang', query.detectTo);
};
