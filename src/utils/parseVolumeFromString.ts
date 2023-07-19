export default function parseVolumeFromString(text: string, title?: string | null) {
  const patterns = [
    { p: /(vol|ch)/gi, i: 2 },
    { p: /(Chapter)[^0-9]*([.0-9]+)/ig, i: 2 },
    { p: /(volume|vol)[ .]*([.0-9]+)/ig, i: 2 },
    { p: /(Episode)[^0-9]*([.0-9]+)/ig, i: 2 },
    { p: /(Eps)[^0-9]*([.0-9]+)/ig, i: 2 },
    { p: /(vol)[ .]*([.0-9]+)/ig, i: 2 },
    { p: /(Ep)[^0-9]*([.0-9]+)/ig, i: 2 },
    { p: /(Ch)[^0-9]*([.0-9]+)/ig, i: 2 },
    { p: /(v)[ .]*([.0-9]+)/ig, i: 2 },
  ];
  const replaceTitle = title ? text.replace(new RegExp(title, 'ig'), '') : text;
  let volume: number | null = patterns.reduce<number | null>((prev, { p, i }) => {
    if (prev !== null) return prev;
    const preparse = /(?:.(?!chp|v|c|vol|volume|chapter|ch|eps|episode|ep))+$/gi.exec(replaceTitle);
    const parse = preparse ? p.exec(preparse[0]) : p.exec(replaceTitle);
    if (parse) {
      return Number.isNaN(Number(parse[i])) ? null : Number(parse[i]);
    }
    return null;
  }, null);

  if (volume === null) {
    volume = patterns.reduce<number | null>((prev, { p, i }) => {
      if (prev !== null) return prev;
      const parse = p.exec(replaceTitle);
      if (parse) {
        return Number.isNaN(Number(parse[i])) ? null : Number(parse[i]);
      }
      return null;
    }, null);
  }

  return {
    volume: volume ? Math.floor(volume) : -1,
    isSpecial: volume ? Math.floor(volume) !== volume : false,
  };
}
