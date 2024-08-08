interface IconObject {
  identifier: string;
  type: 'builtIn' | 'file';
  builtInId?: string;
  file?: string;
}

interface TextConfigObject {
  type: 'secure' | 'visible';
  height?: number;
  placeholderText?: string;
  keyWords?: string[];
}

interface MenuObject {
  title: string;
  value: string;
  defaultPluginIconIdentifier: string;
  defaultPluginName: string;
}

interface OptionObject {
  identifier: string;
  type: 'text' | 'menu';
  title: string;
  defaultValue?: string;
  textConfig?: TextConfigObject;
  menuValues?: MenuObject[];
  desc?: string;
  isKeyOption?: boolean;
}

export interface Info {
  identifier: string;
  version: string;
  category: string;
  name: string;
  summary?: string;
  icon?: string;
  icons?: IconObject[];
  author?: string;
  homepage?: string;
  appcast?: string;
  minBobVersion?: string;
  options?: Record<string, OptionObject>[];
}