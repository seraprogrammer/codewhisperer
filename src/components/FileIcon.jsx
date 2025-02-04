import React from "react";
import {
  FileCode,
  FileJson,
  FileType,
  File,
  Folder,
  FolderOpen,
  FileText,
  Globe,
  Hash,
} from "lucide-react";

export const FileIcon = ({ filename, isFolder = false, isOpen = false }) => {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen className="w-4 h-4 text-blue-400" />
    ) : (
      <Folder className="w-4 h-4 text-blue-400" />
    );
  }

  const extension = filename.split(".").pop().toLowerCase();

  const iconMap = {
    js: <FileCode className="w-4 h-4 text-yellow-500" />,
    jsx: <FileCode className="w-4 h-4 text-blue-500" />,
    ts: <FileType className="w-4 h-4 text-blue-600" />,
    tsx: <FileType className="w-4 h-4 text-blue-500" />,
    json: <FileJson className="w-4 h-4 text-yellow-400" />,
    css: <Hash className="w-4 h-4 text-blue-400" />,
    html: <Globe className="w-4 h-4 text-orange-500" />,
    md: <FileText className="w-4 h-4 text-blue-300" />,
    default: <File className="w-4 h-4 text-gray-400" />,
  };

  return iconMap[extension] || iconMap.default;
};
