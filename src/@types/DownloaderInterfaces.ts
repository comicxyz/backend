import { AxiosHeaders } from 'axios';

type GetChapterImagesInterface = {
  (url: string): Promise<string[]>;
};

type GetInfoFunctionType = () => {
  name: string
  imageUrl?: string
  description: string
  url: string
  disabled?: boolean,
  domains: string[],
};

type GetDownloadImagesRequestHeadersFunctionType = (url: string) => AxiosHeaders;

type GetDownloadImagesRequestHeadersModuleType = {
  default: GetDownloadImagesRequestHeadersFunctionType
};

export {
  GetChapterImagesInterface,
  GetInfoFunctionType,
  GetDownloadImagesRequestHeadersFunctionType,
  GetDownloadImagesRequestHeadersModuleType,
};
