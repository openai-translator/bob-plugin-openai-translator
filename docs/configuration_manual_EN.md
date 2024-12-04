## Configuration Manual

### Service Provider

- Required

- Default value: OpenAI

- Description

  - OpenAI: Use official OpenAI service

  - Azure OpenAI: Use [Azure OpenAI Service](https://learn.microsoft.com/zh-cn/azure/ai-services/Translator/quickstart-text-rest-api)

  - Custom: Use custom service, such as [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) or [Ollama](https://ollama.com/blog/openai-compatibility)

### API URL

- Optional (OpenAI) / Required (Azure OpenAI and Custom)

- Default value: None

- Description

  - OpenAI: Optional, default value: `https://api.openai.com`

  - Azure OpenAI: Required, complete API URL in format:

     ```
     https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION
     ```

     - For more information, please refer to [Cloudflare AI Gateway Official Documentation](https://developers.cloudflare.com/ai-gateway/).

  - Custom: Required, complete API URL, for example when using Cloudflare AI Gateway:

    ```
    https://gateway.ai.cloudflare.com/v1/CLOUDFLARE_ACCOUNT_ID/GATEWAY_ID/openai/chat/completions
    ```

### API KEY

- Required

- Default value: None

- Description

  - Multiple API KEYS under different accounts can be separated by commas to achieve quota doubling and load balancing

### Model

- Required

- Default value: `gpt-3.5-turbo`

- Description

  - When selecting `custom`, the `Custom Model` configuration item needs to be set

### Custom Model

- Optional

- Default value: `gpt-3.5-turbo`

- Description

  - A linked item, when the `Model` configuration selects `custom`, this configuration item's model will be read

### System Prompt

- Optional

- Default value: `You are a translation engine that can only translate text and cannot interpret it.`

- Description

  - Customize System Prompt, filling this will override the default System Prompt

  - Custom Prompt can use the following variables:

    1. `$text`: the text to be translated, i.e., the text in the translation window input box

    2. `$sourceLang`: the source language, i.e., the language of the text in the translation window input box, such as "Simplified Chinese"

    3. `$targetLang`: the target language, i.e., the language into which the text is to be translated, which can be manually selected or automatically detected in the translation window, such as "English"

### User Prompt

- Optional

- Default value: `translate from $sourceLang to $targetLang:\n\n$text`

- Description

  - Customize User Prompt, filling this will override the default User Prompt

  - Can use the same variables as in the system command

### Stream Output

- Optional

- Default value: Enable

- Description

  - When enabled, translation results will be displayed in real-time

  - When disabled, results will be displayed all at once after translation is complete

### Temperature

- Optional

- Default value: `0.2`

- Description

  - The higher the temperature value, the more random and creative the generated text will be

  - For translation tasks, it is recommended to set around `0.2`; for polishing tasks, it can be appropriately increased. If accuracy is highly required, it can be set to `0`
