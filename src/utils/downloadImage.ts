import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { createWriteStream, WriteStream } from 'fs';

export default function downloadImage(
  url: string,
  path: string,
  config?: { headers?: Partial<AxiosRequestHeaders> },
) {
  const writer = createWriteStream(path);
  const UrlObject = new URL(url);
  const fileUrl = `${UrlObject.protocol}//${UrlObject.host}${UrlObject.pathname}`;
  const { username } = UrlObject;
  const { password } = UrlObject;
  const auth = username && password ? { username, password } : undefined;
  return axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream',
    auth,
    headers: (config?.headers || {}) as AxiosRequestHeaders,
  })
    .then((response: AxiosResponse<WriteStream>) => new Promise((res, rej) => {
      response.data.pipe(writer);
      let error: Error | null = null;

      writer.on('error', (err) => {
        error = err;
        writer.close();
        rej(err);
      });

      writer.on('close', () => {
        if (!error) res(true);
      });
    }));
}
