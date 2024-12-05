import { OpenAiAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { OpenAiCompatibleAdapter } from "./openai";
import type { ServiceAdapter, ServiceProvider } from '../types';
import { AzureOpenAiAdapter } from './azure-openai';

export const getServiceAdapter = (serviceProvider: ServiceProvider): ServiceAdapter => {
  switch (serviceProvider) {
    case 'gemini':
      return new GeminiAdapter();
    case 'azure-openai':
      return new AzureOpenAiAdapter();
    case 'openai-compatible':
      return new OpenAiCompatibleAdapter();
    default:
      return new OpenAiAdapter();
  }
}