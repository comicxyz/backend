import { mkdir } from 'fs/promises';
import { join } from 'path';

export function generateChapterDirPath(
  seriesTitle: string,
  chapterTitle: string,
  dir: string,
  subDir = 'Unsorted',
) {
  const path = join(dir, subDir, seriesTitle, chapterTitle);
  return path;
}

export async function makeChapterDirectory(path: string) {
  return mkdir(path, { recursive: true });
}
