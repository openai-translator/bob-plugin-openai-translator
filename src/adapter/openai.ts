import { HttpResponse, ServiceError, TextTranslateQuery, ValidationCompletion } from "@bob-translate/types";
import type { OpenAiChatCompletion, GeminiResponse, OpenAiModelList, ServiceAdapter } from "../types";
import { generatePrompts, handleGeneralError, handleValidateError, replacePromptKeywords } from "../utils";

const isServiceError = (error: unknown): error is ServiceError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ServiceError).message === 'string'
  );
}

export class OpenAiAdapter implements ServiceAdapter {

  private baseUrl = $option.apiUrl || "https://api.openai.com";

  private buffer = '';

  private model = $option.model === "custom" ? $option.customModel : $option.model;

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
  }

  public buildRequestBody(query: TextTranslateQuery) {
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
      // https://github.com/openai/openai-node/blob/master/src/resources/chat/completions#L190
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
        const { statusCode } = resp.response;
        const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
        handleValidateError(completion, {
          type: reason,
          message: resp.data.error,
          troubleshootingLink: "https://bobtranslate.com/service/translate/openai.html"
        });
        return;
      }

      const modelList = resp.data as OpenAiModelList;
      if (modelList.data?.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error as ServiceError);
    }
  }
}

export class OpenAiCompatibleAdapter extends OpenAiAdapter {

  public override getTextGenerationUrl(apiUrl: string): string {
    return apiUrl;
  }

  protected override getValidationUrl(apiUrl: string): string {
    return apiUrl.replace(/\/chat\/completions$/, '/models');
  }
}