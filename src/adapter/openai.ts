import type {
  HttpResponse,
  ServiceError,
  TextTranslateQuery,
  ValidationCompletion,
} from '@bob-translate/types';
import type {
  GeminiResponse,
  OpenAiErrorResponse,
  OpenAiResponse,
  ServiceAdapterConfig,
} from '../types';
import {
  generatePrompts,
  handleValidateError,
  replacePromptKeywords,
} from '../utils';
import { BaseAdapter } from './base';

export class OpenAiAdapter extends BaseAdapter {
  private buffer = '';
  private dataBuffer = ''; // Buffer for incomplete JSON data within a single data: line

  constructor(config?: ServiceAdapterConfig) {
    super(
      config || {
        troubleshootingLink:
          'https://bobtranslate.com/service/translate/openai.html',
        baseUrl: $option.apiUrl || 'https://api.openai.com',
      },
    );
  }

  protected extractErrorFromResponse(
    errorResponse: HttpResponse<unknown>,
  ): ServiceError {
    const data = errorResponse.data as
      | OpenAiErrorResponse
      | Record<string, unknown>;
    const statusCode = errorResponse.response?.statusCode;

    const baseError: ServiceError = {
      type: statusCode === 401 ? 'secretKey' : 'api',
      message: 'API request failed',
      addition: JSON.stringify(data),
      troubleshootingLink: this.config.troubleshootingLink,
    };

    // Case 1: error is string
    if (typeof data?.error === 'string') {
      return {
        ...baseError,
        message: data.error,
      };
    }

    // Case 2: error is object with message
    if (
      typeof data === 'object' &&
      'error' in data &&
      data.error &&
      typeof data.error === 'object' &&
      'message' in data.error
    ) {
      const errorObj = data.error as { message: string; param?: string };
      let errorMessage = errorObj.message;
      if (errorObj.param) {
        errorMessage = `${errorMessage} (parameter: ${errorObj.param})`;
      }
      return {
        ...baseError,
        message: errorMessage,
      };
    }

    // Case 3: Generic error
    return baseError;
  }

  public buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }

  public buildRequestBody(query: TextTranslateQuery): Record<string, unknown> {
    const { customSystemPrompt, customUserPrompt } = $option;
    const { generatedSystemPrompt, generatedUserPrompt } =
      generatePrompts(query);

    let systemPrompt =
      replacePromptKeywords(customSystemPrompt, query) || generatedSystemPrompt;
    const userPrompt =
      replacePromptKeywords(customUserPrompt, query) || generatedUserPrompt;

    const formattingInstructions =
      '\n\nIMPORTANT: Output the translation directly without any quotation marks or special characters wrapping. Do not add quotes like 『』「」"" around the result.';
    systemPrompt += formattingInstructions;

    return {
      model: this.getModel(),
      temperature: this.getTemperature(),
      stream: this.isStreamEnabled(),
      instructions: systemPrompt,
      input: userPrompt,
    };
  }

  public parseResponse(
    response: HttpResponse<GeminiResponse | OpenAiResponse>,
  ): string {
    const { data } = response;

    // Handle Responses API format
    if (typeof data === 'object' && 'output' in data) {
      const openAiResponse = data as OpenAiResponse;
      // Use the helper field if available
      if (openAiResponse.output_text) {
        return openAiResponse.output_text.trim();
      }
      // Otherwise extract from output array
      if (openAiResponse.output && openAiResponse.output.length > 0) {
        // Look for message type items in the output array
        for (const item of openAiResponse.output) {
          if (
            item.type === 'message' &&
            item.content &&
            item.content.length > 0
          ) {
            const text = item.content
              .filter((c) => c.type === 'output_text')
              .map((c) => c.text)
              .join('');
            if (text) {
              return text.trim();
            }
          }
        }
      }
      throw new Error('No output returned from Responses API');
    }

    throw new Error('Unsupported response type');
  }

  public getTextGenerationUrl(_apiUrl: string): string {
    return `${this.config.baseUrl}/v1/responses`;
  }

  protected getValidationUrl(_apiUrl: string): string {
    return `${this.config.baseUrl}/v1/models`;
  }

  protected parseStreamResponse(text: string): string | null {
    if (text === '[DONE]') {
      return null;
    }
    const dataObj = JSON.parse(text);

    // Handle new Responses API event stream format
    // Look for response.output_text.delta events which contain the actual text chunks
    if (dataObj.type === 'response.output_text.delta' && dataObj.delta) {
      return dataObj.delta;
    }

    // Handle old Responses API stream format (if still used)
    if (dataObj.object === 'response.chunk' && dataObj.delta?.output) {
      const output = dataObj.delta.output;
      if (output.length > 0 && output[0].content) {
        return (
          output[0].content
            .filter(
              (c: { type?: string; text?: string }) =>
                c.type === 'output_text' && c.text,
            )
            .map((c: { text?: string }) => c.text)
            .join('') || null
        );
      }
    }

    return null;
  }

  private isLikelyIncompleteJSON(str: string): boolean {
    // Simple heuristic: if parsing fails, check if we have unmatched brackets
    // This avoids complex parsing and handles most streaming JSON cases
    try {
      JSON.parse(str);
      return false; // Valid JSON, not incomplete
    } catch {
      // Check for common incomplete JSON patterns
      // Remove all escaped characters and strings to simplify bracket counting
      const simplified = str
        .replace(/\\./g, '') // Remove escaped characters
        .replace(/"[^"]*"/g, '""'); // Replace string contents with empty strings

      // Count unmatched brackets
      const openBraces = (simplified.match(/{/g) || []).length;
      const closeBraces = (simplified.match(/}/g) || []).length;
      const openBrackets = (simplified.match(/\[/g) || []).length;
      const closeBrackets = (simplified.match(/]/g) || []).length;

      // Also check if string ends with incomplete patterns
      const endsWithIncomplete =
        /[,:]\s*$/.test(str) || // Ends with comma or colon
        /"\s*$/.test(str) || // Ends with quote
        /\\$/.test(str); // Ends with escape

      // Likely incomplete if brackets don't match or has incomplete ending
      return (
        openBraces !== closeBraces ||
        openBrackets !== closeBrackets ||
        endsWithIncomplete
      );
    }
  }

  public handleStream(
    streamData: { text: string },
    query: TextTranslateQuery,
    targetText: string,
  ): string {
    // Check if the entire response is a JSON error (not SSE format)
    if (
      !streamData.text.includes('event:') &&
      !streamData.text.startsWith('data: ') &&
      streamData.text.includes('"error"')
    ) {
      try {
        const errorObj = JSON.parse(streamData.text);
        if (errorObj.error) {
          const errorDetail = errorObj.error;
          throw {
            type: errorDetail.type || 'api',
            message: errorDetail.message || 'API request failed',
            addition: errorDetail.param
              ? `Parameter: ${errorDetail.param}`
              : undefined,
            troubleshootingLink: this.config.troubleshootingLink,
          };
        }
      } catch (parseError) {
        // If it's not valid JSON, continue with SSE processing
        if (
          parseError &&
          typeof parseError === 'object' &&
          'message' in parseError
        ) {
          // Re-throw if it's our error object
          throw parseError;
        }
      }
    }

    this.buffer += streamData.text;

    // SSE events are separated by double newlines
    const events = this.buffer.split('\n\n');

    // Keep the last incomplete event in the buffer
    this.buffer = events.pop() || '';

    for (const event of events) {
      if (!event.trim()) continue;

      // Parse the event
      const lines = event.split('\n');
      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.slice(5).trim();
        }
      }

      // Only process response.output_text.delta events
      if (eventType === 'response.output_text.delta' && eventData) {
        // Combine with any buffered data from previous incomplete JSON
        const dataToProcess = this.dataBuffer + eventData;
        this.dataBuffer = '';

        try {
          const dataObj = JSON.parse(dataToProcess);
          if (dataObj.delta) {
            targetText += dataObj.delta;
            query.onStream({
              result: {
                from: query.detectFrom,
                to: query.detectTo,
                toParagraphs: [targetText],
              },
            });
          }
        } catch (error) {
          // Check if this might be incomplete JSON
          if (
            error instanceof SyntaxError &&
            this.isLikelyIncompleteJSON(dataToProcess)
          ) {
            // Buffer the incomplete JSON for next iteration
            this.dataBuffer = dataToProcess;
          } else {
            // This is a real parsing error, log it but continue
            if (error instanceof Error) {
              console.error(
                'Failed to parse SSE data:',
                error.message,
                'Data:',
                dataToProcess,
              );
            }
            // Clear the buffer on real errors
            this.dataBuffer = '';
          }
        }
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
        method: 'GET',
        url: validationUrl,
        header,
      });

      const responseData = response.data;
      if (responseData?.error) {
        return handleValidateError(
          completion,
          this.extractErrorFromResponse(response),
        );
      }

      // Check if we got a valid models list response
      if (
        responseData &&
        (responseData.data || responseData.object === 'list')
      ) {
        return completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }
}
