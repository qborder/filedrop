
import { UploadedFile } from '../types';

/**
 * Uploads files to the server.
 * The server handles storage (Vercel Blob) and metadata generation (including description).
 */
export const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    // Headers are not strictly necessary for FormData with fetch, browser sets Content-Type
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed with an unknown server error.' }));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetches a list of all uploaded files from the server.
 */
export const getFiles = async (): Promise<UploadedFile[]> => {
  const response = await fetch('/api/files');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch file list.' }));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }
  return response.json();
};

/**
 * Deletes a file from the server.
 * fileId is the Vercel Blob pathname.
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  // The fileId is the Vercel Blob pathname, which can contain slashes.
  // It needs to be properly encoded if sent as a path segment.
  // For this setup, [pathname].ts will capture it.
  const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete file.' }));
    throw new Error(errorData.message || `Server error: ${response.status}`);
  }
  // No explicit JSON body expected on successful delete usually, check for status 204 or 200.
};