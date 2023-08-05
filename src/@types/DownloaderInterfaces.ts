import { AxiosHeaders } from 'axios';
import ComicList from './ComicListInterface';

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
  searchFeature?: boolean,
};

type GetComicListFunctionType = (args?: {
  page?: number, search?: string, category?: string }) => Promise<ComicList>;

type GetDownloadImagesRequestHeadersFunctionType = (url: string) => AxiosHeaders;

type GetDownloadImagesRequestHeadersModuleType = {
  default: GetDownloadImagesRequestHeadersFunctionType
};

export {
  GetChapterImagesInterface,
  GetInfoFunctionType,
  GetDownloadImagesRequestHeadersFunctionType,
  GetDownloadImagesRequestHeadersModuleType,
  GetComicListFunctionType,
};
