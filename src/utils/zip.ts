import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { parse } from 'path';

export default function zip(targetDirPath: string, outputPath: string) {
  const output = createWriteStream(outputPath);
  const zipFile = parse(outputPath).base;

  return new Promise((res, rej) => {
    const archive = archiver('zip', {
      zlib: {
        level: 9,
      }, // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', () => {
      res({
        path: outputPath,
        file: zipFile,
        size: archive.pointer(),
      });
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', () => {
      // console.log('Data has been drained');
      res({
        path: outputPath,
        file: zipFile,
        size: archive.pointer(),
      });
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', (err: Error & { code: string }) => {
      if (err.code === 'ENOENT') {
        // log warning
        rej(err);
      } else {
        // throw error
        rej(err);
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', (err: Error & { code: string }) => {
      rej(err);
    });

    // pipe archive data to the file
    archive.pipe(output);

    archive.directory(targetDirPath, false);
    archive.finalize().catch((err: Error & { code: string }) => console.error(err));
  });
}
