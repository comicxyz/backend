import ChapterInterface from './ChapterInterface';

export default interface SeriesInterface {
  title: string,
  url: string,
  chapters: ChapterInterface[],
}
