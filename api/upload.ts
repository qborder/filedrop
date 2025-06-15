
import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable from 'formidable-serverless'; // Using formidable-serverless for Vercel
import fs from 'fs';
import { generateImageDescriptionFromAPI } from './_lib/geminiUtils';
import { fileToBase64 } from './_lib/imageUtils'; // Using fileToBase64 for files read from disk
import { addMetadataEntry } from './_lib/metadataUtils';
import { UploadedFile } from '../types'; // Path to types.ts from api directory

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing, formidable will handle it
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const form = new formidable.IncomingForm();

  try {
    const parseForm = (): Promise<{ files: formidable.Files }> => {
        return new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    return reject(err);
                }
                resolve({ files });
            });
        });
    };
    
    const { files: formidableFiles } = await parseForm();

    const uploadedFileObjects: UploadedFile[] = [];

    // formidableFiles.files can be an array of files or a single file if only one is uploaded with the same name.
    const filesArray = Array.isArray(formidableFiles.files) ? formidableFiles.files : [formidableFiles.files].filter(f => f);


    for (const file of filesArray) {
      if (!file || !file.name || !file.path) continue;

      const fileStream = fs.createReadStream(file.path);
      const originalFileName = file.name;
      const fileType = file.type || 'application/octet-stream';
      const fileSize = file.size;
      
      // Use a unique pathname for Vercel Blob, incorporating original filename for easier identification (optional)
      const blobPathname = `uploads/${crypto.randomUUID()}-${originalFileName}`;

      const blob = await put(blobPathname, fileStream, {
        access: 'public', // Or 'private' if you want to generate signed URLs for access
        contentType: fileType,
        addRandomSuffix: false, // We created our own unique name
      });

      // Clean up the temporary file created by formidable
      // fs.unlinkSync(file.path); // Moved after potential use by Gemini

      let description = '';
      const isImage = fileType.startsWith('image/');

      if (isImage && process.env.API_KEY && process.env.API_KEY !== "YOUR_API_KEY_HERE") {
        try {
          // Read file into buffer for Gemini and then unlink.
          // This ensures the file is available for base64 conversion.
          const tempFileBuffer = fs.readFileSync(file.path);
          const base64Data = tempFileBuffer.toString('base64');
          description = await generateImageDescriptionFromAPI(base64Data, fileType);
        } catch (geminiError: any) {
          console.error(`Error generating description for ${originalFileName}:`, geminiError);
          description = geminiError.message || "Failed to generate description (server).";
        }
      } else if (isImage) {
        description = "Description generation skipped: API key not configured on server.";
      }
      
      // Now that we're done with the file path (including for Gemini), unlink it.
      fs.unlinkSync(file.path);
      
      const newFileEntry: UploadedFile = {
        id: blob.pathname, // Vercel Blob pathname is the ID
        name: originalFileName,
        type: fileType,
        size: fileSize,
        url: blob.url, // Public URL from Vercel Blob
        description,
        isImage,
      };

      await addMetadataEntry(newFileEntry);
      uploadedFileObjects.push(newFileEntry);
    }

    return res.status(201).json(uploadedFileObjects);

  } catch (error: any) {
    console.error('Upload error:', error);
    // Clean up any temp files if form parsing failed mid-way (formidable might do this)
    // form.on('aborted' / 'error', cleanup);
    return res.status(500).json({ message: error.message || 'An internal server error occurred during upload.' });
  }
}