import { HttpResponse, ServiceError, TextTranslateQuery, ValidationCompletion } from "@bob-translate/types";
import type { OpenAiChatCompletion, GeminiResponse, OpenAiModelList } from "../types";
import { generatePrompts, handleValidateError, isServiceError, replacePromptKeywords } from "../utils";
import { BaseAdapter } from "./base";

export class OpenAiAdapter extends BaseAdapter {

  private baseUrl = $option.apiUrl || "https://api.openai.com";

  private buffer = '';

  private model = $option.model === "custom" ? $option.customModel : $option.model;

  protected troubleshootingLink = "https://bobtranslate.com/service/translate/openai.html";

  protected extractErrorFromResponse(response: HttpResponse<any>): ServiceError {
    const errorData = response.data?.error;
    if (errorData) {
      return {
        type: errorData.code === "invalid_api_key" ? "secretKey" : "api",
        message: errorData.message || "Unknown OpenAI API error",
        addition: errorData.type,
        troubleshootingLink: this.troubleshootingLink
      };
    }

    return {
      type: "api",
      message: "OpenAI API error",
      addition: JSON.stringify(response.data),
      troubleshootingLink: this.troubleshootingLink
    };
  }

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
  }

  public buildRequestBody(query: TextTranslateQuery): Record<string, unknown> {
    const { customSystemPrompt, customUserPrompt, temperature, stream } = $option;
    const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query);

    const systemPrompt = replacePromptKeywords(customSystemPrompt, query) || generatedSystemPrompt;
    const userPrompt = replacePromptKeywords(customUserPrompt, query) || generatedUserPrompt;

    const modelTemperature = Number(temperature) ?? 0.2;

    return {
      model: this.model,
      temperature: modelTemperature,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      stream: stream === "enable",
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
    return `${this.baseUrl}/v1/chat/completions`;
  }

  protected getValidationUrl(_apiUrl: string): string {
    return `${this.baseUrl}/v1/models`;
  }

  private parseStreamResponse(text: string): string | null {
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
              troubleshootingLink: this.troubleshootingLink
            };
          } else {
            throw {
              type: 'param',
              message: 'An unknown error occurred',
              addition: JSON.stringify(error),
              troubleshootingLink: this.troubleshootingLink
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
      const resp = await $http.request({
        method: "GET",
        url: validationUrl,
        header
      });

      if (resp.data.error) {
        handleValidateError(completion, this.extractErrorFromResponse(resp));
        return;
      }

      const modelList = resp.data as OpenAiModelList;
      if (modelList.data?.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }
}

export class OpenAiCompatibleAdapter extends OpenAiAdapter {
  protected override troubleshootingLink = "https://bobtranslate.com/service/translate/openai-compatible.html";
}
