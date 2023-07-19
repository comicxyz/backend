import ComicInfoXml from './ComicInfoXml';

export default interface ChapterInterface {
  url: string,
  title: string,
  seriesTitle: string,
  seriesUrl: string,
  category?: string,
  comicInfoXml?: ComicInfoXml
}

export interface ChapterWithImagesInterface extends ChapterInterface {
  images: string[]
}
