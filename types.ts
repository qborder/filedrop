
export interface UploadedFile {
  id: string; // Will be the Vercel Blob pathname
  file?: File; // Original file object, only present client-side immediately after selection
  name: string;
  type: string;
  size: number;
  url: string; // Permanent URL from Vercel Blob
  description?: string;
  isImage: boolean;
}

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

export interface AppNotification {
  message: string;
  type: NotificationType;
}