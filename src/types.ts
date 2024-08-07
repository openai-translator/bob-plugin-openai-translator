import { HttpErrorCode } from "./const";
import { Language } from "./lang";

// https://bobtranslate.com/plugin/object/serviceerror.html#service-error
type BobServiceErrorType =
  | 'unknown'
  | 'param'
  | 'unsupportedLanguage'
  | 'secretKey'
  | 'network'
  | 'api'
  | 'notFound';

export interface BobServiceError {
  type: BobServiceErrorType; // 错误类型
  message: string; // 错误描述，用于展示给用户看
  addition?: string; // 附加信息，可以是任何可 json 序列化的数据类型，用于 debug
  troubleshootingLink?: string; // 附加的故障排除链接，用于指导用户解决问题
}

export type BobValidateCompletion = (args: { result: boolean, error?: BobServiceError }) => void;

interface DataObject {
  length: number;
  toUTF8(): string | undefined;
  toHex(useUpper?: boolean): string;
  toBase64(): string;
  toByteArray(): number[];
  readUInt8(index: number): number;
  writeUInt8(value: number, index: number): void;
  subData(start: number, end: number): DataObject;
  appendData(data: this): this;
}

interface BobHttpResponseInfo {
  url: string; // url
  MIMEType: string; // MIME 类型
  expectedContentLength: number; // 长度
  textEncodingName: string; // 编码
  suggestedFilename: string; // 建议的文件名
  statusCode: HttpErrorCode; // HTTP 状态码
  headers: any; // HTTP header
}

interface BobHttpResponseError {
  domain: string;
  code: number;
  userInfo: any;
  localizedDescription: string; // 描述
  localizedFailureReason: string; // 原因
  localizedRecoverySuggestion: string; // 建议
}

export interface BobHttpResponse<T = any> {
  data: T; // object / string / $data 解析过后的数据
  rawData: DataObject;
  response: BobHttpResponseInfo; // 请求响应信息
  error: BobHttpResponseError;
}

interface DataPayload {
  message: string;
}

interface Signal {
  send: (data?: DataPayload) => void;
  subscribe: (callback: (data?: DataPayload) => void) => Disposable;
  removeAllSubscriber: () => void;
}

interface PhoneticObject {
  type: 'us' | 'uk'; // 音标类型，值可以是 us 或 uk，分别对应美式音标和英式音标。
  value?: string; // 音标字符串。例如 ɡʊd。
  tts?: TTSResult; // result音标发音数据。
}

interface PartObject {
  part: string; // 单词词性，例如 n.、vi....
  means: string[]; // 词义 string 数组。
}

interface ExchangeObject {
  name: string; // 形式的名字，例如 比较级、最高级...
  words: string[]; // 该形式对于的单词 string 数组，一般只有一个
}

interface RelatedWordObject {
  word: string; // 单词本身。
  means?: string[]; // 词义 string 数组。
}

interface RelatedWordPartObject {
  part?: string; // 词性。
  words: Array<RelatedWordObject>; // 相关的单词数组，见 related word object。
}

interface AdditionObject {
  name: string; // 附加内容名称。
  value: string; // 附加内容。
}

interface ToDictObject {
  phonetics: Array<PhoneticObject>; // 音标数据数组，一般英文查词会有，见 phonetic object。
  parts: Array<PartObject>; // 词性词义数组，一般英文查词会有，见 part object。
  exchanges?: Array<ExchangeObject>; // 其他形式数组，一般英文查词会有，见 exchange object。
  relatedWordParts?: Array<RelatedWordPartObject>; // 相关的单词数组，一般中文查词会有，表示和该中文对应的英文单词有哪些，见 related word part object。
  additions?: Array<AdditionObject>; // 附加内容数组，考虑到以上字段无法覆盖所有词典内容，比如例句、记忆技巧等，可将相应数据添加到该数组，最终也会显示到翻译结果中，见 additions object。
}

interface TranslateResult {
  from: Language; // 由翻译接口提供的源语种，可以与查询时的 from 不同。
  to: Language; // 由翻译接口提供的目标语种，可以与查询时的 to 不同。
  toParagraphs: string[]; // 译文分段拆分过后的 string 数组。
  fromParagraphs?: string[]; // 原文分段拆分过后的 string 数组。
  toDict?: ToDictObject; // 词典结果，见 to dict object。
  fromTTS?: TTSResult; // result原文的语音合成数据。
  toTTS?: TTSResult; // result译文的语音合成数据。
  raw?: any; // 如果插件内部调用了某翻译接口，可将接口原始数据传回，方便定位问题。
}

interface OcrText {
  text: string;
}

interface OcrResult {
  from?: Language; // 图片中的文字的主要语种，可与查询参数中传入的 from 不一致，可不传。
  texts: Array<OcrText>; // 文本识别结果数组，按照段落分割，见 ocr text，必传。
  raw?: any; // 如果插件内部调用了某文本识别接口，可将接口原始数据传回，方便定位问题，可不传。
}

interface TTSResult {
  type: 'url' | 'base64'; // 数据类型，必传。
  value: string; // 值，必传。
  raw?: any; // 如果插件内部调用了某语音合成接口，可将接口原始数据传回，方便定位问题，可不传。
}

type Result = TranslateResult | OcrResult | TTSResult;

type completionResult = { result: Result };
type CompletionError = { error: BobServiceError };

type HandleStream = (args: completionResult) => void;
type Completion = (args: completionResult | CompletionError) => void;

export interface BobTranslateQuery {
  text: string; // 需要翻译的文本
  from: Language; // 用户选中的源语种标准码
  to: Language; // 用户选中的目标语种标准码
  detectFrom: Exclude<Language, 'auto'>; // 检测过后的源语种
  detectTo: Exclude<Language, 'auto'>; // 检测过后的目标语种
  cancelSignal: Signal,
  onStream: HandleStream,
  onCompletion: Completion; // 用于回调翻译结果的函数
}
