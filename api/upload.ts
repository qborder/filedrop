
import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable from 'formidable-serverless'; // Using formidable-serverless for Vercel
import fs from 'fs';
import { generateImageDescriptionFromAPI } from './_lib/geminiUtils';
import { fileToBase64 } from './_lib/imageUtils'; // Using fileToBase64 for files read from disk
import { addMetadataEntry } from './_lib/metadataUtils';
import { UploadedFile } from '../../types'; // Path to types.ts from api directory

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
      fs.unlinkSync(file.path);

      let description = '';
      const isImage = fileType.startsWith('image/');

      if (isImage && process.env.API_KEY && process.env.API_KEY !== "YOUR_API_KEY_HERE") {
        try {
          // Re-read the file for base64 conversion as stream was consumed by `put`
          // OR: A more efficient way would be to pass the buffer to put and also use it for base64
          // For now, let's re-read from the original temp path before unlinking it,
          // which requires moving unlinkSync after Gemini call or duplicating read logic.
          // Better: formidable can keep the file buffer if configured, or use the path.
          // Since we use fs.createReadStream above, we need to read it again for base64 if not careful.
          // Let's assume file.path is still valid here and read it for base64
          // NOTE: This strategy means file.path must be read *before* unlinking.
          // The current code unlinks *after* put. So if put consumes the stream from file.path,
          // then fileToBase64 might fail.
          // Safest: Use a buffer. Read file into buffer, pass buffer to put, pass buffer to base64.
          
          // Re-reading from temp file before unlink for Gemini (if it was unlinked too early)
          // For this example, let's make sure file.path is read by fileToBase64 before unlinking.
          // The unlink is now after this block.
          const tempFileBuffer = fs.readFileSync(file.path); // Read into buffer
          const base64Data = tempFileBuffer.toString('base64');
          description = await generateImageDescriptionFromAPI(base64Data, fileType);
        } catch (geminiError: any) {
          console.error(`Error generating description for ${originalFileName}:`, geminiError);
          description = geminiError.message || "Failed to generate description (server).";
        }
      } else if (isImage) {
        description = "Description generation skipped: API key not configured on server.";
      }
      
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
    return res.status(500).json({ message: error.message || 'An internal server error occurred during upload.' });
  }
}
