import webp from 'webp-converter';

export default function convertWebpToJpg(inputPath: string, outputPath: string) {
  return webp.dwebp(inputPath, outputPath, '-o');
}
