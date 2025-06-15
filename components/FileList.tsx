import React from 'react';
import { UploadedFile } from '../types';
import { FileItem } from './FileItem';

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemoveFile }) => {
  // This component doesn't show "No files uploaded yet" anymore, App.tsx handles that.
  // if (files.length === 0) {
  //   return (
  //     <p className="text-center text-neutral-500 italic">No files uploaded yet. Start by uploading some files!</p>
  //   );
  // }

  return (
    <div className="space-y-5">
      {files.map(file => (
        <FileItem key={file.id} uploadedFile={file} onRemoveFile={onRemoveFile} />
      ))}
    </div>
  );
};