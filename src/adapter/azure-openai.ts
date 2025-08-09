import type {
  HttpResponse,
  ServiceError,
  ValidationCompletion,
} from '@bob-translate/types';
import { handleValidateError } from '../utils';
import { OpenAiAdapter } from './openai';

export class AzureOpenAiAdapter extends OpenAiAdapter {
  constructor() {
    super({
      troubleshootingLink:
        'https://bobtranslate.com/service/translate/azureopenai.html',
    });
  }

  public override buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    };
  }

  public override getTextGenerationUrl(apiUrl: string): string {
    return apiUrl;
  }

  protected override extractErrorFromResponse(
    response: HttpResponse<unknown>,
  ): ServiceError {
    const result = super.extractErrorFromResponse(response);
    // Azure uses 403 for auth errors too
    if (response.response?.statusCode === 403) {
      result.type = 'secretKey';
    }
    return {
      ...result,
      troubleshootingLink: this.config.troubleshootingLink,
    };
  }

  public override async testApiConnection(
    apiKey: string,
    apiUrl: string,
    completion: ValidationCompletion,
  ): Promise<void> {
    const header = this.buildHeaders(apiKey);

    try {
      // Extract model from URL if it's in deployment format
      // Format: /openai/deployments/{deployment}/responses?api-version=preview
      const deploymentMatch = apiUrl.match(/\/deployments\/([^/]+)\/responses/);
      const model = deploymentMatch ? deploymentMatch[1] : 'gpt-5-nano';

      const response = await $http.request({
        method: 'POST',
        url: apiUrl,
        header,
        body: {
          model: model,
          input: "Test connectivity. You ONLY need to reply 'OK'.",
        },
      });

      if (response.data.error) {
        return handleValidateError(
          completion,
          this.extractErrorFromResponse(response),
        );
      }

      // Accept any successful response from Azure OpenAI
      if (response.data && !response.data.error) {
        return completion({ result: true });
      }
    } catch (error) {
      handleValidateError(completion, error);
    }
  }
}
