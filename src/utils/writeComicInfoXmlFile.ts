import { writeFile } from 'fs/promises';
import ComicInfoXml from '../@types/ComicInfoXml';

async function writeComicInfoXmlFile(
  comicInfoXmlPath: string,
  comicInfoXml: ComicInfoXml,
): Promise<void> {
  const comicInfoXmlString = comicInfoXml.xml();
  await writeFile(comicInfoXmlPath, comicInfoXmlString);
}
export default writeComicInfoXmlFile;
