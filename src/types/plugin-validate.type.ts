import { ServiceError } from "./service-error.type";

interface ValidationResult {
  result: boolean;
  error?: ServiceError;
}

export type ValidationCompletion = (result: ValidationResult) => void;

export type PluginValidate = (completion: ValidationCompletion) => void;