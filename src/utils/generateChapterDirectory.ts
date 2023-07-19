import { mkdir } from 'fs/promises';
import { join } from 'path';

export function generateChapterDirPath(
  mangaId: string,
  mangaSlug: string,
  chapterId: string,
  chapterSlug: string,
  subDir = 'Unsorted',
) {
  const dir = process.env.MANGA_DIR || 'manga';
  const path = join(dir, subDir, `${mangaId ? `${mangaId}-` : ''}${mangaSlug}`, `${chapterId ? `${chapterId}-` : ''}${mangaSlug} - ${chapterSlug}`);
  return path;
}

export async function makeChapterDirectory(path: string) {
  return mkdir(path, { recursive: true });
}
