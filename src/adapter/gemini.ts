import { HttpResponse, ServiceError, TextTranslateQuery, ValidationCompletion } from "@bob-translate/types";
import type { OpenAiChatCompletion, GeminiResponse, ServiceAdapter } from "../types";
import { generatePrompts, handleValidateError } from "../utils";

export class GeminiAdapter implements ServiceAdapter {

  private model = $option.model === "custom" ? $option.customModel : $option.model;

  private baseUrl = $option.apiUrl || 'https://generativelanguage.googleapis.com/v1beta/models';

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      "x-goog-api-key": apiKey,
    };
  }

  public buildRequestBody(query: TextTranslateQuery): unknown {
    const { temperature } = $option;

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
        temperature: Number(temperature) ?? 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    };
  }

  public getTextGenerationUrl(_apiUrl: string): string {
    const { stream } = $option;

    const operationName = stream === "enable" ? 'streamGenerateContent' : 'generateContent';
    return `${this.baseUrl}/${this.model}:${operationName}`;
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
    apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);

    try {
      const resp = await $http.request({
        method: "GET",
        url: apiUrl,
        header
      });

      if (resp.data.error) {
        handleValidateError(completion, {
          type: "param",
          message: resp.data.error,
          troubleshootingLink: "https://bobtranslate.com/service/translate/gemini.html"
        });
        return;
      }

      if (resp.data.models?.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error as ServiceError);
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
    } catch (error) {
      throw new Error('Failed to parse Gemini stream response');
    }

    return targetText;
  }
}
