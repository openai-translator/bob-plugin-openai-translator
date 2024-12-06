import { HttpResponse, ServiceError, TextTranslateQuery, ValidationCompletion } from "@bob-translate/types";
import type { OpenAiChatCompletion, GeminiResponse, OpenAiModelList, ServiceAdapterConfig, OpenAiErrorDetail, OpenAiErrorResponse } from "../types";
import { generatePrompts, handleValidateError, isServiceError, replacePromptKeywords, createTypeGuard } from "../utils";
import { BaseAdapter } from "./base";

const hasOpenAiErrorShape = createTypeGuard<OpenAiErrorResponse>({
  error: {
    type: 'object'
  }
});

const hasOpenAiErrorDetailShape = createTypeGuard<OpenAiErrorDetail>({
  message: { type: 'string' },
  code: { type: 'string' },
  type: { type: 'string' },
  param: { type: 'string', nullable: true }
});

export class OpenAiAdapter extends BaseAdapter {
  private buffer = '';

  constructor(config?: ServiceAdapterConfig) {
    super(config || {
      troubleshootingLink: "https://bobtranslate.com/service/translate/openai.html",
      baseUrl: $option.apiUrl || "https://api.openai.com"
    });
  }

  protected extractErrorFromResponse(errorResponse: HttpResponse<unknown>): ServiceError {
    if (hasOpenAiErrorShape(errorResponse.data) && hasOpenAiErrorDetailShape(errorResponse.data.error)) {
      const { error: errorDetail } = errorResponse.data;
      return {
        type: errorDetail.code === "invalid_api_key" ? "secretKey" : "api",
        message: errorDetail.message || "Unknown OpenAI API error",
        addition: errorDetail.type,
        troubleshootingLink: this.config.troubleshootingLink
      };
    }

    return {
      type: "api",
      message: errorResponse.response.statusCode === 401 ? "Invalid API key" : "OpenAI API error",
      addition: JSON.stringify(errorResponse.data),
      troubleshootingLink: this.config.troubleshootingLink
    };
  }

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
  }

  public buildRequestBody(query: TextTranslateQuery): Record<string, unknown> {
    const { customSystemPrompt, customUserPrompt } = $option;
    const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query);

    const systemPrompt = replacePromptKeywords(customSystemPrompt, query) || generatedSystemPrompt;
    const userPrompt = replacePromptKeywords(customUserPrompt, query) || generatedUserPrompt;

    return {
      model: this.getModel(),
      temperature: this.getTemperature(),
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      stream: this.isStreamEnabled(),
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

  public parseResponse(response: HttpResponse<GeminiResponse | OpenAiChatCompletion>): string {
    const { data } = response;
    if (typeof data === 'object' && 'choices' in data) {
      const { choices } = data;
      if (!choices || choices.length === 0) {
        throw new Error("No choices returned from API");
      }
      let text = choices[0].message.content?.trim();

      // 使用正则表达式删除字符串开头和结尾的特殊字符
      text = text?.replace(/^(『|「|"|")|(』|」|"|")$/g, "");

      // 判断并删除字符串末尾的 `" =>`
      if (text?.endsWith('" =>')) {
        text = text.slice(0, -4);
      }
      return text || '';
    }
    throw new Error("Unsupported response type");
  }

  public getTextGenerationUrl(_apiUrl: string): string {
    return `${this.config.baseUrl}/v1/chat/completions`;
  }

  protected getValidationUrl(_apiUrl: string): string {
    return `${this.config.baseUrl}/v1/models`;
  }

  protected parseStreamResponse(text: string): string | null {
    if (text === '[DONE]') {
      return null;
    }

    try {
      const dataObj = JSON.parse(text);
      const { choices } = dataObj;
      return choices[0]?.delta?.content || null;
    } catch (error) {
      throw error;
    }
  }

  public handleStream(
    streamData: { text: string },
    query: TextTranslateQuery,
    targetText: string
  ): string {
    this.buffer += streamData.text;

    while (true) {
      const match = this.buffer.match(/data: (.*?})\n/);
      if (match) {
        const textFromResponse = match[1].trim();
        try {
          const delta = this.parseStreamResponse(textFromResponse);
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
            const { type, message, addition } = error;
            throw {
              type: type || 'param',
              message: message || 'Failed to parse JSON',
              addition,
              troubleshootingLink: this.config.troubleshootingLink
            };
          } else {
            throw {
              type: 'param',
              message: 'An unknown error occurred',
              addition: JSON.stringify(error),
              troubleshootingLink: this.config.troubleshootingLink
            };
          }
        }
        this.buffer = this.buffer.slice(match[0].length);
      } else {
        break;
      }
    }

    return targetText;
  }

  public async testApiConnection(
    apiKey: string,
    apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);
    const validationUrl = this.getValidationUrl(apiUrl);

    try {
      const response = await $http.request({
        method: "GET",
        url: validationUrl,
        header
      });

      if (hasOpenAiErrorShape(response.data)) {
        handleValidateError(completion, this.extractErrorFromResponse(response));
        return;
      }

      const modelList = response.data as OpenAiModelList;
      if (modelList.data?.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }
}
