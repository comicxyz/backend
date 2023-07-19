export interface ComicInfoXmlInterface {
  Title?: string;
  Series?: string;
  Number?: string;
  Count?: number;
  Volume?: number;
  AlternateSeries?: string;
  AlternateNumber?: string;
  AlternateCount?: number;
  Summary?: string;
  Notes?: string;
  Year?: number;
  Month?: number;
  Day?: number;

  Writer?: string;
  Penciller?: string;
  Inker?: string;
  Colorist?: string;
  Letterer?: string;
  CoverArtist?: string;
  Editor?: string;
  Translator?: string;
  Publisher?: string;
  Imprint?: string;

  Genre?: string;
  Tags?: string;
  Web?: string;

  PageCount?: number;
  LanguageISO?: string;
  Format?: string;
  BlackAndWhite?: ['Unknown', 'Yes', 'No'];
  Manga?: MangaTypeEnum;

  Characters?: string;
  Teams?: string;
  Locations?: string;
  ScanInformation?: string;
  StoryArc?: string;
  StoryArcNumber?: string;
  SeriesGroup?: string;
  AgeRating?: AgeRatingEnum;
  Pages?: ComicPageInfo[];
  CommunityRating?: 0 | 1 | 2 | 3 | 4 | 5;
  MainCharacterOrTeam?: string;
  Review?: string;
}

export enum MangaTypeEnum {
  Unknown = 'Unknown',
  NO = 'No',
  YES = 'Yes',
  YESANDRIGHTTOLEFT = 'YesAndRightToLeft',
}

export enum AgeRatingEnum {
  UNKNOWN = 'Unknown',
  ADULTS_ONLY_18 = 'Adults Only 18+',
  EARLY_CHILDHOOD = 'Early Childhood',
  EVERYONE = 'Everyone',
  EVERYONE_18 = 'Everyone 10+',
  G = 'G',
  KIDS_TO_ADULTS = 'Kids to Adults',
  M = 'M',
  MA15 = 'MA15+',
  M17 = 'Mature 17+',
  PG = 'PG',
  R18 = 'R18+',
  RATING_PENDING = 'Rating Pending',
  TEEN = 'Teen',
  X18 = 'X18+',
}

export interface ComicPageInfo {
  Image: number;
  Story: ComicPageType;
  DoublePage: boolean;
  ImageSize: number;
  Key: string;
  Bookmark: string;
  ImageWidth: number;
  ImageHeight: number;
}

export enum ComicPageType {
  FRONTCOVER = 'FrontCover',
  INNERCOVER = 'InnerCover',
  ROUNDUP = 'Roundup',
  STORY = 'Story',
  ADVERTISEMENT = 'Advertisement',
  EDITORIAL = 'Editorial',
  LETTERS = 'Letters',
  PREVIEW = 'Preview',
  BACKCOVER = 'BackCover',
  OTHER = 'Other',
  DELETED = 'Deleted',
}
