import { OpenAiAdapter } from "./openai";

export class OpenAiCompatibleAdapter extends OpenAiAdapter {
  public override getTextGenerationUrl(apiUrl: string): string {
    return apiUrl;
  }

  protected override getValidationUrl(apiUrl: string): string {
    return apiUrl.replace(/\/chat\/completions$/, '/models');
  }
}
