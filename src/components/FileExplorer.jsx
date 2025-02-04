import React, { useState } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  X,
} from "lucide-react";
import { getIconForFile, getIconForFolder } from "vscode-icons-js";
import { FileIcon } from "./FileIcon";

// Add a helper function for file icons and colors
const getFileIconAndColor = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();

  const iconColors = {
    js: "text-yellow-500",
    jsx: "text-blue-500",
    ts: "text-blue-600",
    tsx: "text-blue-500",
    css: "text-blue-400",
    html: "text-orange-500",
    json: "text-yellow-400",
    md: "text-blue-300",
    default: "text-gray-400",
  };

  return iconColors[extension] || iconColors.default;
};

export const FileExplorerPanel = ({
  isDarkMode,
  files,
  setFiles,
  onFileClick,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [creationType, setCreationType] = useState(null);

  const generateUniqueId = () =>
    `file_${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateNew = (type) => {
    setCreationType(type);
    setIsCreatingNew(true);
    setNewItemName("");
  };

  const handleKeyDown = (e, parentPath = []) => {
    if (e.key === "Enter" && newItemName.trim()) {
      const newItem = {
        id: generateUniqueId(),
        name: newItemName.trim() + (creationType === "file" ? ".js" : ""),
        type: creationType,
        content: creationType === "file" ? "// New file content" : null,
        children: creationType === "folder" ? [] : null,
      };

      setFiles((prevFiles) => {
        const updateFiles = (items, path) => {
          if (path.length === 0) {
            return [...items, newItem];
          }
          return items.map((item) => {
            if (item.id === path[0]) {
              return {
                ...item,
                children: updateFiles(item.children || [], path.slice(1)),
              };
            }
            return item;
          });
        };
        return updateFiles(prevFiles, parentPath);
      });

      setIsCreatingNew(false);
      setNewItemName("");
    } else if (e.key === "Escape") {
      setIsCreatingNew(false);
      setNewItemName("");
    }
  };

  const getIconUrl = (name, isFolder) => {
    const iconPath = isFolder ? getIconForFolder(name) : getIconForFile(name);
    return `https://cdn.jsdelivr.net/npm/vscode-icons-js@latest/icons/${iconPath}`;
  };

  const renderFileTree = (items, path = []) => {
    return items.map((item) => (
      <div key={item.id} className="ml-4">
        <div
          className={`flex items-center py-1 px-2 hover:bg-[#2d2d2d] cursor-pointer ${
            isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-700"
          }`}
          onClick={() => {
            if (item.type === "file") {
              onFileClick(item);
            } else {
              setFiles((prevFiles) => {
                const updateFiles = (items) => {
                  return items.map((f) => {
                    if (f.id === item.id) {
                      return { ...f, isOpen: !f.isOpen };
                    }
                    return f;
                  });
                };
                return updateFiles(prevFiles);
              });
            }
          }}
        >
          <div className="mr-2">
            <FileIcon
              filename={item.name}
              isFolder={item.type === "folder"}
              isOpen={item.type === "folder" && item.isOpen}
            />
          </div>
          <span className="truncate">{item.name}</span>
        </div>

        {item.type === "folder" && item.isOpen && (
          <div className="ml-4">
            {renderFileTree(item.children || [], [...path, item.id])}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div
      className={`w-60 h-full overflow-y-auto ${
        isDarkMode ? "bg-[#252526]" : "bg-gray-100"
      }`}
    >
      <div className="p-2">
        <div className="flex justify-between items-center mb-2">
          <span
            className={`text-sm font-semibold ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            EXPLORER
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCreateNew("file")}
              className={`p-1 hover:bg-[#3c3c3c] rounded ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
              title="New File"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNew("folder")}
              className={`p-1 hover:bg-[#3c3c3c] rounded ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {renderFileTree(files)}
        {isCreatingNew && (
          <div className="flex items-center py-1 px-2 ml-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              className="bg-[#3c3c3c] text-white px-2 py-1 rounded w-full"
              placeholder={`New ${creationType}...`}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};
