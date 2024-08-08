import { Language } from "../lang";
import { ServiceError } from "./service-error.type";

export interface TtsQuery {
  text: string; // 需要合成的文本
  lang: Exclude<Language, 'auto'>; // 当前文本的语言，一定不是 auto。
}

export interface TtsResult {
  type: 'url' | 'base64'; // 数据类型，必传。
  value: string; // 值，必传。
  raw?: any; // 如果插件内部调用了某语音合成接口，可将接口原始数据传回，方便定位问题，可不传。
}

type TtsCompletion = (args: TtsResult | ServiceError) => void;

export type Tts = (query: TtsQuery, completion: TtsCompletion) => void;