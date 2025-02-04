import React, { useState } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  X,
  Edit,
  Trash2,
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
  const [creatingInFolderId, setCreatingInFolderId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const generateUniqueId = () =>
    `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateNew = (type, folderId, e) => {
    e.stopPropagation();
    setCreationType(type);
    setIsCreatingNew(true);
    setCreatingInFolderId(folderId);
    setNewItemName("");
  };

  const submitNewItem = (e) => {
    if (e.key === "Enter" && newItemName.trim()) {
      const newItem = {
        id: generateUniqueId(),
        name:
          creationType === "file" && !newItemName.includes(".")
            ? `${newItemName}.js`
            : newItemName,
        type: creationType,
        content: creationType === "file" ? "// New file content" : null,
        children: creationType === "folder" ? [] : null,
        isOpen: creationType === "folder" ? true : false,
      };

      setFiles((prevFiles) => {
        const addNewItem = (items) => {
          return items.map((item) => {
            if (item.id === creatingInFolderId) {
              return {
                ...item,
                isOpen: true, // Open the folder when adding new item
                children: [...(item.children || []), newItem],
              };
            }
            if (item.children) {
              return {
                ...item,
                children: addNewItem(item.children),
              };
            }
            return item;
          });
        };

        return creatingInFolderId
          ? addNewItem(prevFiles)
          : [...prevFiles, newItem];
      });

      setIsCreatingNew(false);
      setCreatingInFolderId(null);
      setNewItemName("");
    } else if (e.key === "Escape") {
      setIsCreatingNew(false);
      setCreatingInFolderId(null);
      setNewItemName("");
    }
  };

  const getIconUrl = (name, isFolder) => {
    const iconPath = isFolder ? getIconForFolder(name) : getIconForFile(name);
    return `https://cdn.jsdelivr.net/npm/vscode-icons-js@latest/icons/${iconPath}`;
  };

  const handleRename = (id, e) => {
    e.stopPropagation();
    const findItem = (items) => {
      for (let item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const itemToRename = findItem(files);
    if (itemToRename) {
      setRenameValue(itemToRename.name);
      setRenameItemId(id);
      setIsRenaming(true);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this item?")) {
      setFiles((prevFiles) => {
        const deleteItem = (items) => {
          return items.filter((item) => {
            if (item.id === id) return false;
            if (item.children) {
              item.children = deleteItem(item.children);
            }
            return true;
          });
        };
        return deleteItem([...prevFiles]);
      });
    }
  };

  const submitRename = (e) => {
    if (e.key === "Enter" && renameValue.trim()) {
      setFiles((prevFiles) => {
        const renameItem = (items) => {
          return items.map((item) => {
            if (item.id === renameItemId) {
              return {
                ...item,
                name:
                  item.type === "file" && !renameValue.includes(".")
                    ? `${renameValue}.js`
                    : renameValue,
              };
            }
            if (item.children) {
              return {
                ...item,
                children: renameItem(item.children),
              };
            }
            return item;
          });
        };
        return renameItem(prevFiles);
      });

      setIsRenaming(false);
      setRenameItemId(null);
      setRenameValue("");
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameItemId(null);
      setRenameValue("");
    }
  };

  const renderFileTree = (items, path = []) => {
    return items.map((item) => (
      <div key={item.id} className="ml-4">
        <div
          className={`flex items-center py-1 px-2 hover:bg-[#2d2d2d] cursor-pointer group ${
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
          <div className="flex-1 flex items-center min-w-0">
            <div className="mr-2">
              <FileIcon
                filename={item.name}
                isFolder={item.type === "folder"}
                isOpen={item.type === "folder" && item.isOpen}
              />
            </div>
            {isRenaming && renameItemId === item.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={submitRename}
                className={`w-full px-1 rounded ${
                  isDarkMode
                    ? "bg-[#3c3c3c] text-white"
                    : "bg-white text-gray-800"
                }`}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{item.name}</span>
            )}
          </div>

          <div className="hidden group-hover:flex items-center space-x-1">
            {item.type === "folder" && (
              <>
                <button
                  onClick={(e) => handleCreateNew("file", item.id, e)}
                  className={`p-1 rounded-sm ${
                    isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
                  }`}
                  title="New File"
                >
                  <FilePlus className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={(e) => handleCreateNew("folder", item.id, e)}
                  className={`p-1 rounded-sm ${
                    isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
                  }`}
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </>
            )}
            <button
              onClick={(e) => handleRename(item.id, e)}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
              }`}
              title="Rename"
            >
              <Edit className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
              }`}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>

        {isCreatingNew && creatingInFolderId === item.id && (
          <div className="ml-4 mt-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={submitNewItem}
              placeholder={`New ${creationType}...`}
              className={`w-full px-2 py-1 rounded ${
                isDarkMode
                  ? "bg-[#3c3c3c] text-white placeholder-gray-500"
                  : "bg-white text-gray-800 placeholder-gray-400"
              }`}
              autoFocus
            />
          </div>
        )}

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
          <div className="flex space-x-1">
            <button
              onClick={(e) => handleCreateNew("file", null, e)}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
              }`}
              title="New File"
            >
              <FilePlus className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => handleCreateNew("folder", null, e)}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
              }`}
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {isCreatingNew && !creatingInFolderId && (
          <div className="mb-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={submitNewItem}
              placeholder={`New ${creationType}...`}
              className={`w-full px-2 py-1 rounded ${
                isDarkMode
                  ? "bg-[#3c3c3c] text-white placeholder-gray-500"
                  : "bg-white text-gray-800 placeholder-gray-400"
              }`}
              autoFocus
            />
          </div>
        )}

        {renderFileTree(files)}
      </div>
    </div>
  );
};
