import { ServiceError, ValidationCompletion } from "@bob-translate/types";
import { handleValidateError } from "../utils";
import { OpenAiChatCompletion } from "../types";
import { OpenAiAdapter } from "./openai";

export class AzureOpenAiAdapter extends OpenAiAdapter {
  constructor() {
    super({
      troubleshootingLink: "https://bobtranslate.com/service/translate/azureopenai.html"
    });
  }

  public override buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "api-key": apiKey,
    };
  }

  public override getTextGenerationUrl(apiUrl: string): string {
    return apiUrl;
  }

  protected override extractErrorFromResponse(response: any): ServiceError {
    const errorData = response.data?.error;
    if (errorData) {
      const isAuthError = errorData.code === "401" ||
        errorData.code === "403" ||
        errorData.message?.toLowerCase().includes("key") ||
        errorData.message?.toLowerCase().includes("auth");

      return {
        type: isAuthError ? "secretKey" : "api",
        message: errorData.message || "Unknown Azure OpenAI API error",
        addition: errorData.code,
        troubleshootingLink: this.config.troubleshootingLink
      };
    }

    return {
      type: "api",
      message: "Azure OpenAI API error",
      addition: JSON.stringify(response.data),
      troubleshootingLink: this.config.troubleshootingLink
    };
  }

  public override async testApiConnection(
    apiKey: string,
    apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);

    try {
      const response = await $http.request({
        method: "POST",
        url: apiUrl,
        header,
        body: {
          messages: [{
            content: "You are a helpful assistant.",
            role: "system",
          }, {
            content: "Test connection.",
            role: "user",
          }],
          max_tokens: 5
        }
      });

      if (response.data.error) {
        handleValidateError(completion, this.extractErrorFromResponse(response));
        return;
      }

      if ((response.data as OpenAiChatCompletion).choices.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }
}
