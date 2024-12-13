import { HttpResponse, ServiceError, TextTranslateQuery, ValidationCompletion } from "@bob-translate/types";
import type { OpenAiChatCompletion, GeminiResponse } from "../types";
import { generatePrompts, handleValidateError } from "../utils";
import { BaseAdapter } from "./base";

export class GeminiAdapter extends BaseAdapter {
  constructor() {
    super({
      troubleshootingLink: "https://bobtranslate.com/service/translate/gemini.html",
      baseUrl: $option.apiUrl || 'https://generativelanguage.googleapis.com/v1beta/models'
    });
  }

  protected extractErrorFromResponse(response: HttpResponse<any>): ServiceError {
    const errorData = response.data?.error;
    if (errorData) {
      const isAuthError = errorData.status === "UNAUTHENTICATED" ||
        errorData.status === "PERMISSION_DENIED" ||
        errorData.message?.includes("API key");

      return {
        type: isAuthError ? "secretKey" : "api",
        message: errorData.message || "Unknown Gemini API error",
        addition: errorData.status,
        troubleshootingLink: this.config.troubleshootingLink
      };
    }

    return {
      type: "api",
      message: "Gemini API error",
      addition: JSON.stringify(response.data),
      troubleshootingLink: this.config.troubleshootingLink
    };
  }

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      "x-goog-api-key": apiKey,
    };
  }

  public buildRequestBody(query: TextTranslateQuery): Record<string, unknown> {
    const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query);

    return {
      system_instruction: {
        parts: {
          text: generatedSystemPrompt
        }
      },
      contents: {
        parts: {
          text: generatedUserPrompt
        }
      },
      generationConfig: {
        temperature: this.getTemperature(),
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    };
  }

  public getTextGenerationUrl(_apiUrl: string): string {
    const operationName = this.isStreamEnabled() ? 'streamGenerateContent' : 'generateContent';
    return `${this.config.baseUrl}/${this.getModel()}:${operationName}`;
  }

  public parseResponse(response: HttpResponse<GeminiResponse | OpenAiChatCompletion>): string {
    const { data } = response;
    if (typeof data === 'object' && 'candidates' in data) {
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }
      return data.candidates[0].content.parts[0].text.trim();
    }

    throw new Error("Unsupported response type");
  }

  public async testApiConnection(
    apiKey: string,
    _apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);

    try {
      const response = await $http.request({
        method: "GET",
        url: this.config.baseUrl!,
        header
      });

      if (response.data.error) {
        handleValidateError(completion, this.extractErrorFromResponse(response));
        return;
      }

      if (response.data.models?.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }

  public handleStream(
    streamData: { text: string },
    query: TextTranslateQuery,
    targetText: string
  ): string {
    try {
      const cleanedText = streamData.text.startsWith(',')
        ? streamData.text.slice(1)
        : streamData.text;

      const parsedChunk = JSON.parse(cleanedText);
      const text = parsedChunk.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        targetText += text;
        query.onStream({
          result: {
            from: query.detectFrom,
            to: query.detectTo,
            toParagraphs: [targetText],
          },
        });
      }
    } catch (_error) {
      throw new Error('Failed to parse Gemini stream response');
    }

    return targetText;
  }
}
