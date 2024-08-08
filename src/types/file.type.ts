import { Data } from "./data.type";

interface FileWriteOptions {
  data: Data;  // $data 类型
  path: string;  // 目标路径
}

interface FileCopyMoveOptions {
  src: string;  // 源路径
  dst: string;  // 目标路径
}

export interface FileConstructor {
  read(path: string): any;  // 返回 $data 类型
  write(options: FileWriteOptions): boolean;
  delete(path: string): boolean;
  list(path: string): string[];
  copy(options: FileCopyMoveOptions): boolean;
  move(options: FileCopyMoveOptions): boolean;
  mkdir(path: string): boolean;
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
}
