import { Language } from "../lang";
import { Data } from "./data.type";
import { ServiceError } from "./service-error.type";

interface OcrText {
  text: string;
}

export interface OcrQuery {
  image: Data; // 需要识别的图片数据
  from: Language; // 目前用户选中的源语言，可能是 auto。
  detectFrom: Exclude<Language, 'auto'>; // 图片中最可能的语言
}

export interface OcrResult {
  from?: Language; // 图片中的文字的主要语种，可与查询参数中传入的 from 不一致，可不传。
  texts: Array<OcrText>; // 文本识别结果数组，按照段落分割，见 ocr text，必传。
  raw?: any; // 如果插件内部调用了某文本识别接口，可将接口原始数据传回，方便定位问题，可不传。
}

type OcrCompletion = (args: OcrResult | ServiceError) => void;

export type Ocr = (query: OcrQuery, completion: OcrCompletion) => void;