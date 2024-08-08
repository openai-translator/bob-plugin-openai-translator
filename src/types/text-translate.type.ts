import { Language } from "../lang";
import { ServiceError } from "./service-error.type";
import { Signal } from "./signal.type";
import { TtsResult } from "./tts.type";

interface PhoneticObject {
  type: 'us' | 'uk'; // 音标类型，值可以是 us 或 uk，分别对应美式音标和英式音标。
  value?: string; // 音标字符串。例如 ɡʊd。
  tts?: TtsResult; // result音标发音数据。
}

interface PartObject {
  part: string; // 单词词性，例如 n.、vi. 等等。
  means: string[]; // 词义 string 数组。
}

interface ExchangeObject {
  name: string; // 形式的名字，例如比较级、最高级等等。
  words: string[]; // 该形式对于的单词 string 数组，一般只有一个。
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
  /**
   * @remarks Bob 0.6.0+ 可用
   */
  word: string; // 单词/词组，一般英文查词会有。
  phonetics: Array<PhoneticObject>; // 音标数据数组，一般英文查词会有，见 phonetic object。
  parts: Array<PartObject>; // 词性词义数组，一般英文查词会有，见 part object。
  exchanges?: Array<ExchangeObject>; // 其他形式数组，一般英文查词会有，见 exchange object。
  relatedWordParts?: Array<RelatedWordPartObject>; // 相关的单词数组，一般中文查词会有，表示和该中文对应的英文单词有哪些，见 related word part object。
  additions?: Array<AdditionObject>; // 附加内容数组，考虑到以上字段无法覆盖所有词典内容，比如例句、记忆技巧等，可将相应数据添加到该数组，最终也会显示到翻译结果中，见 additions object。
}

export interface TextTranslateResult {
  /**
   * @deprecated The field should not be used
   */
  fromParagraphs?: string[]; // 原文分段拆分过后的 string 数组，可不传。
  toParagraphs: string[]; // 译文分段拆分过后的 string 数组。
  toDict?: ToDictObject; // 词典结果，见 to dict object。
  from: Language; // 由翻译接口提供的源语种，可以与查询时的 from 不同。
  to: Language; // 由翻译接口提供的目标语种，可以与查询时的 to 不同。
  fromTTS?: TtsResult; // result原文的语音合成数据。
  toTTS?: TtsResult; // result译文的语音合成数据。

  raw?: any; // 如果插件内部调用了某翻译接口，可将接口原始数据传回，方便定位问题。
}

interface TextTranslateCompletionResult {
  result: TextTranslateResult | TtsResult;
};

interface TextTranslateCompletionError {
  error: ServiceError
};

type HandleStream = (args: TextTranslateCompletionResult) => void;
type HandleCompletion = (args: TextTranslateCompletionResult | TextTranslateCompletionError) => void;

export interface TextTranslateQuery {
  text: string; // 需要翻译的文本
  from: Language; // 目前用户选中的源语言，可能是 auto
  to: Language; // 用户选中的目标语种标准码
  detectFrom: Exclude<Language, 'auto'>; // 检测过后的源语种
  detectTo: Exclude<Language, 'auto'>; // 检测过后的目标语种
  /**
   * @remarks Bob 1.8.0+ 可用
   */
  cancelSignal: Signal,
  /**
   * @remarks Bob 1.8.0+ 可用
   */
  onStream: HandleStream,
  /**
   * @remarks Bob 1.8.0+ 可用
   */
  onCompletion: HandleCompletion; // 用于回调翻译结果的函数
}

/**
 * @param {TextTranslateQuery} query - 用于传入需要翻译的文本信息
 * @param {HandleCompletion} completion - Bob 1.8.0 之前可以调用本函数回调翻译结果，Bob 1.8.0+ 不再推荐使用
 */
export type TextTranslate = (query: TextTranslateQuery, completion: HandleCompletion) => void;
