import { OpenAiAdapter } from './openai';

export class OpenAiCompatibleAdapter extends OpenAiAdapter {
  public override getTextGenerationUrl(apiUrl: string): string {
    if (!apiUrl.endsWith('/responses')) {
      throw new Error(
        'API URL must end with /responses for OpenAI Compatible services',
      );
    }
    return apiUrl;
  }

  protected override getValidationUrl(apiUrl: string): string {
    return apiUrl.replace(/\/responses$/, '/models');
  }
}
