
import { list, put, del, head, download } from '@vercel/blob';
import { UploadedFile } from '../../types'; // Adjust path as needed if types.ts moves or api is structured differently

const METADATA_FILE_PATH = '_metadata/index.json';

// Type for entries within our index.json. We don't store the File object here.
type StoredFileMetadata = Omit<UploadedFile, 'file'>;

export async function getMetadataList(): Promise<StoredFileMetadata[]> {
  try {
    const blob = await download(METADATA_FILE_PATH);
    const jsonData = await blob.json();
    return jsonData as StoredFileMetadata[];
  } catch (error: any) {
    if (error.status === 404 || error.statusCode === 404) { // Vercel Blob specific error for not found
      return []; // File doesn't exist, return empty list
    }
    console.error("Error fetching metadata list:", error);
    throw error; // Re-throw other errors
  }
}

export async function addMetadataEntry(entry: StoredFileMetadata): Promise<void> {
  let list = await getMetadataList();
  // Add new entry to the beginning of the list (newest first)
  list = [entry, ...list];
  await put(METADATA_FILE_PATH, JSON.stringify(list, null, 2), {
    access: 'public', // Or 'private' if you handle signed URLs for downloads
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function removeMetadataEntry(fileIdToDelete: string): Promise<void> {
  // fileIdToDelete is the Vercel Blob pathname
  let list = await getMetadataList();
  list = list.filter(entry => entry.id !== fileIdToDelete);
  await put(METADATA_FILE_PATH, JSON.stringify(list, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}
