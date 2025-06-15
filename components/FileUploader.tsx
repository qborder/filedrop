import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';


interface FileUploaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingGlobal: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoadingGlobal }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 hover:border-sky-500 rounded-xl transition-all duration-300 ease-in-out bg-neutral-800/30 hover:bg-neutral-800/60 group">
      <input
        type="file"
        id="file-upload"
        multiple
        onChange={onFileUpload}
        className="hidden"
        disabled={isLoadingGlobal}
        aria-label="File uploader"
      />
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center cursor-pointer p-8 rounded-lg w-full
                    transition-opacity duration-200
                    ${isLoadingGlobal ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
        role="button"
        aria-disabled={isLoadingGlobal}
      >
        {isLoadingGlobal ? (
          <SpinnerIcon className="w-16 h-16 text-sky-400 mb-4" />
        ) : (
          <UploadIcon className="w-16 h-16 text-sky-400 mb-4 transition-transform duration-300 group-hover:scale-110" />
        )}
        <span className="text-xl font-medium text-neutral-200 group-hover:text-sky-300 transition-colors duration-200">
          {isLoadingGlobal ? 'Processing files...' : 'Click to browse or drag & drop files'}
        </span>
        <p className="text-md text-neutral-500 group-hover:text-neutral-400 mt-2 transition-colors duration-200">
          Any file type. Links are temporary for this demo.
        </p>
      </label>
    </div>
  );
};