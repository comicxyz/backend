import unzipper from 'extract-zip';

export default function unzip(
  zipFilePath: string,
  outputPath: string,
) {
  return unzipper(zipFilePath, {
    dir: outputPath,
  });
}
