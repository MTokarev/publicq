/**
 * LLM provider types
 */
export enum LlmProvider {
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek'
}

/**
 * LLM integration configuration options
 */
export interface LlmIntegrationOptions {
  /**
   * Indicates whether LLM integration is enabled
   */
  enabled: boolean;

  /**
   * Choice of LLM provider
   */
  provider: LlmProvider;
}

/**
 * OpenAI configuration options
 */
export interface OpenAIOptions {
  /**
   * API key for accessing OpenAI services
   */
  apiKey: string;

  /**
   * Model to be used for OpenAI interactions
   * @remarks This parameter hasn't any constraints here, but you should ensure that the model you specify
   * is supported by OpenAI and compatible with your usage scenario.
   * @default "gpt-4"
   */
  model: string;

  /**
   * Maximum number of tokens for the OpenAI model
   * @default 4096
   */
  maxTokens: number;

  /**
   * Model response temperature setting
   * @default 0.7
   */
  temperature: number;
}
