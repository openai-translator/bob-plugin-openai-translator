## Configuration Manual

### Service Name

- Optional
- Default value: OpenAI Translator

### API URL

- Optional
- Default value: `https://api.openai.com`
- Description
  - Customizing the API URL can address issues of service instability and IP bans by switching to a reverse proxy service to enhance stability and protect our IP address from being banned by OpenAI.
  - Alternatively, using API gateway services provided by cloud vendors, such as Cloudflare AI Gateway, not only proxies OpenAI API requests but also adds extra features like caching, call analytics, and log management.
    - Set the API URL to `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_TAG}/${GATEWAY}/openai` to experience it.
    - For more information, please refer to [Cloudflare AI Gateway Official Documentation](https://developers.cloudflare.com/ai-gateway/).

### Dep. Name

- Optional
- Default value: None
- Description
  - This field must be filled in when using the Azure OpenAI Service, for specific steps, please refer to [Azure OpenAI Translation Settings](https://bobtranslate.com/service/translate/azureopenai.html)
  - [🔗 Official Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api)

### API Version

- Optional
- Default value: None
- Description
  - This field must be filled in when using the Azure OpenAI Service, for specific steps, please refer to [Azure OpenAI Translation Settings](https://bobtranslate.com/service/translate/azureopenai.html)
  - [🔗 Official Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api)

### API KEY

- Mandatory
- Default value: None
- Description
  - Multiple API KEYS under different accounts can be separated by commas to achieve quota doubling and load balancing

### Model

- Mandatory
- Default value: `gpt-3.5-turbo-1106`
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
- Default value: `translate from $sourceLang to $targetLang:/n/n $text`
- Description
  - Customize User Prompt, filling this will override the default User Prompt
  - Can use the same variables as in the system command

### Temperature

- Optional
- Default value: `0.2`
- Description
  - The higher the temperature value, the more random and creative the generated text will be.
  - For translation tasks, it is recommended to set around `0.2`; for polishing tasks, it can be appropriately increased. If accuracy is highly required, it can be set to `0`.
