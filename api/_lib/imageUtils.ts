
import { Readable } from 'stream';

// Converts a Buffer or Readable stream to a base64 string
export const streamToBase64 = (stream: Readable | Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(stream)) {
      resolve(stream.toString('base64'));
      return;
    }
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
  });
};

// If reading from a file path (e.g., after formidable saves a temp file)
import fs from 'fs';
export const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data.toString('base64'));
    });
  });
};
