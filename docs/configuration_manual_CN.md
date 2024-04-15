## 配置手册

### 服务名称

- 可选项
- 默认值: OpenAl Translator

### API URL

- 可选项
- 默认值: `https://api.openai.com`
- 说明
  - 自定义 API URL 可以解决服务不稳定以及 IP 被封禁的问题，切换到反向代理服务来提高稳定性，并保护我们的 IP 地址不被 OpenAI 封禁
  - 或者是使用一些云服务商提供的 API 网关服务，比如 Cloudflare AI Gateway，除了可以代理 OpenAI 的 API 请求外，还额外增加了缓存、调用分析以及日志管理等功能
    - 将 API URL 设置为 `https://gateway.ai.cloudflare.com/v1/${ACCOUNT_TAG}/${GATEWAY}/openai` 即可体验
    - 更多信息请参阅 [Cloudflare AI Gateway 官方文档](https://developers.cloudflare.com/ai-gateway/)

### Dep. Name

- 可选项
- 默认值: 无
- 说明
  - 当使用 Azure OpenAI Service 服务时，需要填写此项，具体步骤可参阅 [Azure OpenAI 翻译设置](https://bobtranslate.com/service/translate/azureopenai.html)
  - [🔗 Azure OpenAI Service 官方文档](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api)

### API Version

- 可选项
- 默认值: 无
- 说明
  - 当使用 Azure OpenAI Service 服务时，需要填写此项，具体步骤可参阅 [Azure OpenAI 翻译设置](https://bobtranslate.com/service/translate/azureopenai.html)
  - [🔗 Azure OpenAI Service 官方文档](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/chatgpt-quickstart?tabs=command-line&pivots=rest-api)

### API KEY

- 必填项
- 默认值: 无
- 说明
  - 可使用英文逗号分割多个账号下不同的 API KEY 以实现额度加倍及负载均衡

### 模型

- 必选项
- 默认值: `gpt-3.5-turbo-1106`
- 说明
  - 选择 `custom` 时，需要设置 `自定义模型` 配置项

### 自定义模型

- 可选项
- 默认值: `gpt-3.5-turbo`
- 说明
  - 联动项，当 `模型` 配置选择 `custom` 时，会读取此配置项设置的模型

### 系统指令

- 可选项
- 默认值: `You are a translation engine that can only translate text and cannot interpret it.`
- 说明
  - 自定义 System Prompt，填写则会覆盖默认的 System Prompt
  - 自定义 Prompt可使用以下变量：
    1. `＄text`：需要翻译的文本，即翻译窗口输入框内的文本 
    2. `$sourceLang`：-原文语言， 即翻译窗口输入框内文本的语言，比如「简体中文」
    3. `＄targetLang`：目标语言，即需要翻译成的语言，可以在翻译窗口中手动选择或自动检测，比如「English」

### 用户指令

- 可选项
- 默认值: `translate from $sourceLang to $targetLang:/n/n $text`
- 说明
  - 自定义 User Prompt，填写则会覆盖默认的 User Prompt
  - 可以使用与系统指令中相同的变量

### 温度

- 可选项
- 默认值: `0.2`
- 说明
  - 温度值越高，生成的文本越随机，更有创意。
  - 翻译任务建议设置在 `0.2` 左右，润色任务可以适当调高，如果需要严谨性，可以设置为 `0`。
