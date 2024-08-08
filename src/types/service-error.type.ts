// https://bobtranslate.com/plugin/object/serviceerror.html#service-error
type ServiceErrorType =
  | 'unknown'
  | 'param'
  | 'unsupportedLanguage'
  | 'secretKey'
  | 'network'
  | 'api'
  | 'notFound';

export interface ServiceError {
  type: ServiceErrorType; // 错误类型
  message: string; // 错误描述，用于展示给用户看
  addition?: string; // 附加信息，可以是任何可 json 序列化的数据类型，用于 debug
  troubleshootingLink?: string; // 故障排除的链接，目前主要用在插件验证的功能
}