import { ServiceError, ValidationCompletion } from "@bob-translate/types";
import { handleValidateError } from "../utils";
import { OpenAiChatCompletion } from "../types";
import { OpenAiAdapter } from "./openai";

export class AzureOpenAiAdapter extends OpenAiAdapter {

  public override buildHeaders(apiKey: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "api-key": apiKey,
    };
  }

  public override getTextGenerationUrl(apiUrl: string): string {
    return apiUrl;
  }

  public override async testApiConnection(
    apiKey: string,
    apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);

    try {
      const resp = await $http.request({
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

      if (resp.data.error) {
        const { statusCode } = resp.response;
        const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
        handleValidateError(completion, {
          type: reason,
          message: resp.data.error,
          troubleshootingLink: "https://bobtranslate.com/service/translate/azureopenai.html"
        });
        return;
      }

      if ((resp.data as OpenAiChatCompletion).choices.length > 0) {
        completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error as ServiceError);
    }
  }
}
