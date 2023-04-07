declare namespace Bob {
  // https://ripperhe.gitee.io/bob/#/plugin/addtion/language
  enum LanguagesEnum {
    'auto' = '自动',
    'zh-Hans' = '中文简体',
    'zh-Hant' = '中文繁体',
    'yue' = '粤语',
    'wyw' = '文言文',
    'pysx' = '拼音缩写',
    'en' = '英语',
    'ja' = '日语',
    'ko' = '韩语',
    'fr' = '法语',
    'de' = '德语',
    'es' = '西班牙语',
    'it' = '意大利语',
    'ru' = '俄语',
    'pt' = '葡萄牙语',
    'nl' = '荷兰语',
    'pl' = '波兰语',
    'ar' = '阿拉伯语',
    'af' = '南非语',
    'am' = '阿姆哈拉语',
    'az' = '阿塞拜疆语',
    'be' = '白俄罗斯语',
    'bg' = '保加利亚语',
    'bn' = '孟加拉语',
    'bo' = '藏语',
    'bs' = '波斯尼亚语',
    'ca' = '加泰隆语',
    'ceb' = '宿务语',
    'chr' = '切罗基语',
    'co' = '科西嘉语',
    'cs' = '捷克语',
    'cy' = '威尔士语',
    'da' = '丹麦语',
    'el' = '希腊语',
    'eo' = '世界语',
    'et' = '爱沙尼亚语',
    'eu' = '巴斯克语',
    'fa' = '波斯语',
    'fi' = '芬兰语',
    'fj' = '斐济语',
    'fy' = '弗里西语',
    'ga' = '爱尔兰语',
    'gd' = '苏格兰盖尔语',
    'gl' = '加利西亚语',
    'gu' = '古吉拉特语',
    'ha' = '豪萨语',
    'haw' = '夏威夷语',
    'he' = '希伯来语',
    'hi' = '印地语',
    'hmn' = '苗语',
    'hr' = '克罗地亚语',
    'ht' = '海地克里奥尔语',
    'hu' = '匈牙利语',
    'hy' = '亚美尼亚语',
    'id' = '印尼语',
    'ig' = '伊博语',
    'is' = '冰岛语',
    'jw' = '爪哇语',
    'ka' = '格鲁吉亚语',
    'kk' = '哈萨克语',
    'km' = '高棉语',
    'kn' = '卡纳达语',
    'ku' = '库尔德语',
    'ky' = '柯尔克孜语',
    'la' = '老挝语',
    'lb' = '卢森堡语',
    'lo' = '老挝语',
    'lt' = '立陶宛语',
    'lv' = '拉脱维亚语',
    'mg' = '马尔加什语',
    'mi' = '毛利语',
    'mk' = '马其顿语',
    'ml' = '马拉雅拉姆语',
    'mn' = '蒙古语',
    'mr' = '马拉地语',
    'ms' = '马来语',
    'mt' = '马耳他语',
    'mww' = '白苗语',
    'my' = '缅甸语',
    'ne' = '尼泊尔语',
    'no' = '挪威语',
    'ny' = '齐切瓦语',
    'or' = '奥里亚语',
    'otq' = '克雷塔罗奥托米语',
    'pa' = '旁遮普语',
    'ps' = '普什图语',
    'ro' = '罗马尼亚语',
    'rw' = '卢旺达语',
    'sd' = '信德语',
    'si' = '僧伽罗语',
    'sk' = '斯洛伐克语',
    'sl' = '斯洛文尼亚语',
    'sm' = '萨摩亚语',
    'sn' = '修纳语',
    'so' = '索马里语',
    'sq' = '阿尔巴尼亚语',
    'sr' = '塞尔维亚语',
    'sr-Cyrl' = '塞尔维亚语-西里尔文',
    'sr-Latn' = '塞尔维亚语-拉丁文',
    'st' = '塞索托语',
    'su' = '巽他语',
    'sv' = '瑞典语',
    'sw' = '斯瓦希里语',
    'ta' = '泰米尔语',
    'te' = '泰卢固语',
    'tg' = '塔吉克语',
    'th' = '泰语',
    'tk' = '土库曼语',
    'tl' = '菲律宾语',
    'tlh' = '克林贡语',
    'to' = '汤加语',
    'tr' = '土耳其语',
    'tt' = '鞑靼语',
    'ty' = '塔希提语',
    'ug' = '维吾尔语',
    'uk' = '乌克兰语',
    'ur' = '乌尔都语',
    'uz' = '乌兹别克语',
    'vi' = '越南语',
    'xh' = '科萨语',
    'yi' = '意第绪语',
    'yo' = '约鲁巴语',
    'yua' = '尤卡坦玛雅语',
    'zu' = '祖鲁语',
  }
  type Languages = Array<keyof typeof LanguagesEnum>;
  type supportLanguages = Languages;
  type Language = keyof typeof LanguagesEnum;

  // https://ripperhe.gitee.io/bob/#/plugin/quickstart/translate
  type Translate = (query: TranslateQuery, completion: Completion) => void;
  type completionResult = { result: Result };
  type CompletionResult = { error: ServiceError };
  type Completion = (args: completionResult | CompletionResult) => void;
  interface TranslateQuery {
    text: string; // 需要翻译的文本
    from: Language; // 用户选中的源语种标准码
    to: Language; // 用户选中的目标语种标准码
    detectFrom: Exclude<Language, 'auto'>; // 检测过后的源语种
    detectTo: Exclude<Language, 'auto'>; // 检测过后的目标语种
  }
  interface OcrQuery {
    from: Language; //  目前用户选中的源语言
    image: Data; //  需要识别的图片数据
    detectFrom: Exclude<Language, 'auto'>; //  图片中最可能的语言，如果插件不具备检测语种的能力，可直接使用该属性。
  }
  interface TTSQuery {
    text: string; // 需要合成的文本
    lang: Exclude<Language, 'auto'>; // 当前文本的语种。
  }
  type Query = TranslateQuery | OcrQuery | TTSQuery;

  // https://ripperhe.gitee.io/bob/#/plugin/quickstart/info
  interface Info {
    identifier: string; // 插件的唯一标识符，必须由数字、小写字母和 . 组成。
    category: 'translate' | 'ocr' | 'tts'; // 插件类别，分别对应文本翻译、文本识别和语音合成。
    version: string; // 插件版本号，必须由数字、小写字母和 . 组成。
    name: string; // 插件名称，无限制，建议别太长。
    summary?: string; // 插件描述信息。
    icon?: string; // 插件图标标识符，如果插件根目录有 icon.png 文件，则会将其作为插件图标，不会读取该字段；如果没有，会读取该字段，值可以为 这个图标列表 中所包含的任意一个ID。
    author?: string; // 插件作者。
    homepage?: string; // 插件主页网址。
    appcast?: string; // 插件发布信息 URL。
    minBobVersion?: string; // 最低支持本插件的 Bob 版本，建议填写您开发插件时候的调试插件的 Bob 版本，目前应该是 0.5.0。
    options?: OptionObject[];
  }
  interface MenuObject {
    title: string; // 菜单选项名称，用于展示。
    value: string; // 当前菜单被选中时的值。
  }
  interface OptionObject {
    identifier: string; // 选项唯一标识符，取值时使用。
    type: 'text' | 'menu'; // 选项类型，分别对应输入框和菜单。
    title: string; // 选项名称，用于展示。
    defaultValue?: string; // 默认值。
    menuValues?: MenuObject[]; // type 为 menu 时必须有菜单选项数组，详情见 menu object。
  }

  // https://ripperhe.gitee.io/bob/#/plugin/quickstart/publish
  interface Appcast {
    identifier: string; // 插件的唯一标识符，需和插件 info.json 文件中的唯一标识符一致。
    versions: Array<VersionObject>; // 版本信息数组，请倒序排列，新版本放前面。具体结构看 version object。
  }
  interface VersionObject {
    version: string; // 版本号，请与对应插件包 info.json 中的信息一致。
    desc: string; // 插件的更新内容。
    sha256: string; // 插件包 SHA256 哈希值，会和从 url 中下载的插件包进行校验。
    url: string; // 插件包下载地址。
    minBobVersion?: string; // 最低支持本插件的 Bob 版本，请与对应插件包 info.json 中的信息一致。
  }

  // https://ripperhe.gitee.io/bob/#/plugin/api/option
  type Option = {
    [propName: string]: string;
  };

  // https://ripperhe.gitee.io/bob/#/plugin/api/log
  interface Log {
    info: (msg: string) => void; // 用于打印一些常规的信息
    error: (msg: string) => void; // 用于打印错误信息
  }

  // https://ripperhe.gitee.io/bob/#/plugin/api/http
  interface Http {
    request<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
    get<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
    post<T = any, R = HttpResponsePromise<T>>(config: HttpRequestConfig): Promise<R>;
  }
  type HttpMethod =
    | 'get'
    | 'GET'
    | 'delete'
    | 'DELETE'
    | 'head'
    | 'HEAD'
    | 'options'
    | 'OPTIONS'
    | 'post'
    | 'POST'
    | 'put'
    | 'PUT';

  interface HttpRequestConfig {
    url: string;
    method?: HttpMethod;
    header?: any;
    params?: any;
    body?: any;
    files?: HttpRequestFiles;
    handler?: (resp: HttpResponse) => void;
    timeout?: number;
  }
  interface HttpRequestFiles {
    data: DataObject; // 二进制数据
    name: string; // 上传表单中的名称
    filename: string; // 上传之后的文件名
    'content-type': string; // 文件格式
  }
  interface HttpResponse<T = any> {
    data: T; // object / string / $data 解析过后的数据
    rawData: DataObject;
    response: HttpResponseInfo; // 请求响应信息
    error: HttpResponseError;
  }
  interface HttpResponseInfo {
    url: string; // url
    MIMEType: string; // MIME 类型
    expectedContentLength: number; // 长度
    textEncodingName: string; // 编码
    suggestedFilename: string; // 建议的文件名
    statusCode: number; // HTTP 状态码
    headers: any; // HTTP header
  }
  interface HttpResponseError {
    domain: string;
    code: number;
    userInfo: any;
    localizedDescription: string; // 描述
    localizedFailureReason: string; // 原因
    localizedRecoverySuggestion: string; // 建议
  }
  type HttpResponsePromise<T = any> = Promise<HttpResponse<T>>;

  // https://ripperhe.gitee.io/bob/#/plugin/api/file
  interface File {
    read(path: string): DataObject;
    write(object: { data: DataObject; path: string }): boolean;
    delete(path: string): boolean;
    list(path: string): string[];
    copy(object: { src: string; dst: string }): boolean;
    move(object: { src: string; dst: string }): boolean;
    mkdir(path: string): boolean;
    exists(path: string): boolean;
    isDirectory(path: string): boolean;
  }

  // https://ripperhe.gitee.io/bob/#/plugin/api/data
  interface Data {
    fromUTF8: (data: string) => DataObject;
    fromHex: (data: string) => DataObject;
    fromBase64: (data: string) => DataObject;
    fromByteArray(data: number[]): DataObject;
    fromData: (data: DataObject) => DataObject;
    isData: (data: any) => boolean;
  }
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

  // https://ripperhe.gitee.io/bob/#/plugin/object/serviceerror
  interface ServiceError {
    type: ServiceErrorType; // 错误类型
    message: string; // 错误描述，用于展示给用户看
    addtion: string; // 附加信息，可以是任何可 json 序列化的数据类型，用于 debug
  }
  enum ServiceErrorEnum {
    unknown = '未知错误',
    param = '参数错误',
    unsupportLanguage = '不支持的语种',
    secretKey = '缺少秘钥',
    network = '网络异常，网络请失败',
    api = '服务接口异常',
  }
  type ServiceErrorType = keyof typeof ServiceErrorEnum;

  // https://ripperhe.gitee.io/bob/#/plugin/object/translateresult
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
  interface ToDictObject {
    phonetics: Array<PhoneticObject>; // 音标数据数组，一般英文查词会有，见 phonetic object。
    parts: Array<PartObject>; // 词性词义数组，一般英文查词会有，见 part object。
    exchanges?: Array<ExchangeObject>; // 其他形式数组，一般英文查词会有，见 exchange object。
    relatedWordParts?: Array<RelatedWordPartObject>; // 相关的单词数组，一般中文查词会有，表示和该中文对应的英文单词有哪些，见 related word part object。
    addtions?: Array<AddtionObject>; // 附加内容数组，考虑到以上字段无法覆盖所有词典内容，比如例句、记忆技巧等，可将相应数据添加到该数组，最终也会显示到翻译结果中，见 addtion object。
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
  interface RelatedWordPartObject {
    part?: string; // 词性。
    words: Array<RelatedWordObject>; // 相关的单词数组，见 related word object。
  }
  interface RelatedWordObject {
    word: string; // 单词本身。
    means?: string[]; // 词义 string 数组。
  }
  interface AddtionObject {
    name: string; // 附加内容名称。
    value: string; // 附加内容。
  }

  // https://ripperhe.gitee.io/bob/#/plugin/object/ttsresult
  interface TTSResult {
    type: 'url' | 'base64'; // 数据类型，必传。
    value: string; // 值，必传。
    raw?: any; // 如果插件内部调用了某语音合成接口，可将接口原始数据传回，方便定位问题，可不传。
  }

  // https://ripperhe.gitee.io/bob/#/plugin/object/ocrresult
  interface OcrResult {
    from?: Language; // 图片中的文字的主要语种，可与查询参数中传入的 from 不一致，可不传。
    texts: Array<OcrText>; // 文本识别结果数组，按照段落分割，见 ocr text，必传。
    raw?: any; // 如果插件内部调用了某文本识别接口，可将接口原始数据传回，方便定位问题，可不传。
  }
  interface OcrText {
    text: string;
  }

  type Result = TranslateResult | OcrResult | TTSResult;
}

declare var $http: Bob.Http;
declare var $info: Bob.Info;
declare var $option: Bob.Option;
declare var $log: Bob.Log;
declare var $data: Bob.Data;
declare var $file: Bob.File;

declare function supportLanguages(): Bob.supportLanguages;
declare function translate(query: Bob.TranslateQuery, completion: Bob.Completion): void;
declare function ocr(query: Bob.OcrQuery, completion: Bob.Completion): void;
declare function tts(query: Bob.TTSQuery, completion: Bob.Completion): void;
