export interface Data {
  readonly length: number;

  toUTF8(): string | undefined;
  toHex(useUpper?: boolean): string;
  toBase64(): string;
  toByteArray(): number[];

  readUInt8(index: number): number;
  writeUInt8(value: number, index: number): void;

  subData(start: number, end: number): Data;
  /**
   *
   * @remarks 这个方法拼接一个 $data 对象的数据到当前对象的末尾，会改变当前对象
   *
   */
  appendData(data: Data): void;
}

export interface DataConstructor {
  fromUTF8(text: string): Data;
  fromHex(hex: string): Data;
  fromBase64(base64: string): Data;
  fromByteArray(array: number[]): Data;
  fromData(data: Data): Data;
  isData(object: any): object is Data;
}

