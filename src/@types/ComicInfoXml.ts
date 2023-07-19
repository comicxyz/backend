/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-underscore-dangle */
import { json2xml, xml2json } from 'xml-js';
import { AgeRatingEnum, ComicInfoXmlInterface } from './ComicInfoXmlInterface.js';

export default class ComicInfoXml implements ComicInfoXmlInterface {
  Title: string;

  Series: string;

  Web: string;

  Summary: string;

  Notes?: string;

  Publisher?: string;

  Genre?: string;

  PageCount?: number;

  Volume: number;

  Author?: string;

  Year?: number;

  Month?: number;

  Day?: number;

  AgeRating: AgeRatingEnum;

  CommunityRating: 0 | 1 | 2 | 3 | 4 | 5;

  Format?: string;

  constructor(args: {
    Title: string,
    Series: string,
    Volume: number,
    Web: string,
    Summary?: string | undefined,
    Year?: number | undefined,
    Month?: number | undefined,
    Day?: number | undefined,
    Notes?: string | undefined,
    PageCount?: number | undefined,
    Publisher?: string | undefined,
    Genre?: string[] | string | undefined,
    Author?: string | undefined,
    AgeRating?: AgeRatingEnum | undefined,
    CommunityRating?: number | undefined
    Format?: string,
  } | ComicInfoXml) {
    this.Title = args.Title;
    this.Series = args.Series;
    this.Volume = args.Volume || -1;
    this.Summary = args.Summary || '';
    this.Web = args.Web || '';

    if (args.Year) {
      this.Year = args.Year;
      if (args.Month) {
        this.Month = args.Month;
        if (args.Day) {
          this.Day = args.Day;
        }
      }
    }

    if (args.Notes !== undefined) {
      this.Notes = args.Notes || '';
    }

    if (args.PageCount !== undefined) {
      this.PageCount = args.PageCount || 0;
    }

    if (args.Author !== undefined) {
      this.Author = args.Author || '';
    }
    if (args.Publisher !== undefined) {
      this.Publisher = args.Publisher || undefined;
    }

    if (args.Genre) {
      this.Genre = Array.isArray(args.Genre) ? args.Genre.join(', ') : (args.Genre);
    }

    this.AgeRating = args.AgeRating || AgeRatingEnum.UNKNOWN;

    if (args.Format) {
      this.Format = args.Format;
    }

    const commRating = args.CommunityRating || 0;

    if (commRating < 0 || commRating > 5) {
      // TODO: should override and log the error
      throw new Error(`Community Rating must be between 0 and 5. Found ${commRating}`);
    }

    this.CommunityRating = Math.round(commRating) as 0 | 1 | 2 | 3 | 4 | 5;
  }

  xml() {
    const json = {
      _declaration: { _attributes: { version: '1.0' } },
      ComicInfo: {
        _attributes: {
          'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema', 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        },
        ...this,
      },
    };
    return json2xml(JSON.stringify(json), { compact: true, spaces: 2 });
  }

  static fromXml(xml: string) {
    const { ComicInfo: json } = JSON.parse(xml2json(xml, { compact: true }));
    return new ComicInfoXml({
      Title: json.Title._text,
      Series: json.Series._text,
      Volume: Number(json.Volume._text),
      Web: json.Web._text,
      Summary: json.Summary._text,
      AgeRating: json.AgeRating._text,
      Author: json.Author?._text || '',
      CommunityRating: json.CommunityRating._text,
      Year: Number(json.Year?._text || 2023),
      Month: Number(json.Month?._text || 1),
      Day: Number(json.Day?._text || 1),
      Format: json.Format?._text,
      Genre: json.Genre?._text,
      Notes: json.Notes?._text,
      PageCount: Number(json.PageCount?._text) || undefined,
      Publisher: json.Publisher?._text,
    });
  }
}
