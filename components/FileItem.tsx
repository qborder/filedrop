
import React, { useState } from 'react';
import { UploadedFile } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from '../src/components/icons/CheckIcon'; // Changed path

interface FileItemProps {
  uploadedFile: UploadedFile;
  onRemoveFile: (fileId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileItem: React.FC<FileItemProps> = ({ uploadedFile, onRemoveFile }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(uploadedFile.url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      setCopyStatus('failed');
      console.error('Failed to copy link: ', err);
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const getCopyButtonContent = () => {
    switch (copyStatus) {
      case 'copied':
        return <><CheckIcon className="w-3 h-3 mr-1.5 text-green-400" /> Copied!</>;
      case 'failed':
        return <>Failed</>; // Consider an X icon
      default:
        return <><ClipboardIcon className="w-3 h-3 mr-1.5" /> Copy Link</>;
    }
  };


  return (
    <article className="bg-neutral-900 shadow-xl rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 transition-all duration-300 hover:shadow-sky-500/20 hover:ring-1 hover:ring-sky-600">
      {uploadedFile.isImage && (
        <div className="w-full sm:w-28 h-28 sm:h-auto flex-shrink-0 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center aspect-square">
          <img 
            src={uploadedFile.url} 
            alt={uploadedFile.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      {!uploadedFile.isImage && (
         <div className="w-full sm:w-28 h-28 sm:h-auto flex-shrink-0 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 aspect-square">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-semibold text-sky-400 truncate hover:text-sky-300 transition-colors" title={uploadedFile.name}>
          <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">{uploadedFile.name}</a>
        </h3>
        <p className="text-sm text-neutral-400">{uploadedFile.type} - {formatFileSize(uploadedFile.size)}</p>
        
        {/* Removed descriptionLoading check as it's not part of UploadedFile type */}
        {/* The description field itself will contain any relevant info from the server */}
        {uploadedFile.description && (
          <p className="text-sm text-neutral-300 mt-1.5 italic">
            "{uploadedFile.description}"
          </p>
        )}

        <div className="mt-3 flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleCopyLink}
            className={`flex items-center px-3 py-1.5 text-xs rounded-md transition-all duration-200 font-medium
                        ${copyStatus === 'copied' ? 'bg-green-600 hover:bg-green-500 text-white' : ''}
                        ${copyStatus === 'failed' ? 'bg-red-600 hover:bg-red-500 text-white' : ''}
                        ${copyStatus === 'idle' ? 'bg-sky-600 hover:bg-sky-500 text-white' : ''}`}
            title="Copy link to clipboard"
          >
            {getCopyButtonContent()}
          </button>
          <a
            href={uploadedFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs rounded-md transition-colors font-medium"
            title="Open file in new tab"
          >
            <EyeIcon className="w-3 h-3 mr-1.5" />
            Preview
          </a>
          <a
            href={uploadedFile.url}
            download={uploadedFile.name}
            className="flex items-center px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-md transition-colors font-medium"
            title="Download file"
          >
            <DownloadIcon className="w-3 h-3 mr-1.5" />
            Download
          </a>
        </div>
      </div>
      <button 
        onClick={() => onRemoveFile(uploadedFile.id)} 
        className="flex-shrink-0 p-2.5 text-neutral-500 hover:text-red-400 rounded-full hover:bg-neutral-700/50 transition-all duration-200"
        title="Remove file"
        aria-label="Remove file"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </article>
  );
};
