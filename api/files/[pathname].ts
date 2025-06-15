
import { NextApiRequest, NextApiResponse } from 'next';
import { del as deleteFromBlob } from '@vercel/blob';
import { removeMetadataEntry, getMetadataList } from '../_lib/metadataUtils'; // Adjusted path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end('Method Not Allowed');
  }

  const { pathname } = req.query;

  if (typeof pathname !== 'string' || !pathname) {
    return res.status(400).json({ message: 'File pathname is required.' });
  }

  try {
    // Find the file in metadata to get its full URL for deletion from blob
    // Vercel Blob's del function expects an array of full URLs.
    const metadataList = await getMetadataList();
    const fileToDelete = metadataList.find(f => f.id === pathname);

    if (!fileToDelete) {
      // It might be that metadata is out of sync or file never existed.
      // We can still try to remove from metadata if it exists by ID (pathname)
      // And attempt to delete from blob if we can guess the URL (but safer to use stored URL)
      console.warn(`File with pathname ${pathname} not found in metadata for deletion, but attempting removal.`);
      // If we don't have the URL, we can't reliably delete from blob unless `del` supports pathnames (it expects URLs).
      // For this setup, we *must* have the URL from metadata or construct it if there's a fixed pattern.
      // Since put gives a URL, we should use that.
      return res.status(404).json({ message: 'File not found in metadata.' });
    }
    
    // Delete from Vercel Blob storage
    await deleteFromBlob([fileToDelete.url]);

    // Remove from our metadata index
    await removeMetadataEntry(pathname);

    return res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error: any) {
    console.error(`Error deleting file ${pathname}:`, error);
    // Check if error is from Vercel Blob for file not found, which might be acceptable
    if (error.status === 404 || error.message?.includes('NOT_FOUND')) {
         // If blob was already deleted but metadata entry existed, try removing metadata anyway
        try {
            await removeMetadataEntry(pathname);
            return res.status(200).json({ message: 'File already deleted from storage, metadata cleaned.' });
        } catch (metaError: any) {
            return res.status(500).json({ message: 'File deleted from storage, but failed to clean metadata.' });
        }
    }
    return res.status(500).json({ message: error.message || 'Failed to delete file.' });
  }
}
