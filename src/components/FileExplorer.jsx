import React, { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  X,
  Edit,
  Trash2,
  ChevronRight,
  Download,
  Copy,
} from "lucide-react";
import { getIconForFile, getIconForFolder } from "vscode-icons-js";
import { FileIcon } from "./FileIcon";
import JSZip from "jszip";

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
  onFileDelete,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [creationType, setCreationType] = useState(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Add context menu state
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    type: null,
    targetId: null,
  });

  const generateUniqueId = () =>
    `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateNew = (type, folderId, e) => {
    e.stopPropagation();
    setCreationType(type);
    setIsCreatingNew(true);
    setCreatingInFolderId(folderId);
    setNewItemName("");
  };

  const handleRename = (id) => {
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

  const handleDelete = (id) => {
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

      // Close any open tabs for the deleted file
      if (typeof onFileDelete === "function") {
        onFileDelete(id);
      }
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

  const handleContextMenu = (e, type, id) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      type,
      targetId: id,
    });
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, type: null, targetId: null });
  }, []);

  // Add useEffect for handling context menu clicks outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.show, closeContextMenu]);

  const renderFileTree = (items, path = []) => {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className={`flex items-center py-[2px] cursor-pointer group relative
            ${
              isDarkMode
                ? "hover:bg-[#2a2d2e] active:bg-[#37373d]"
                : "hover:bg-[#e8e8e9] active:bg-[#d8d8d8]"
            }`}
          style={{ paddingLeft: `${path.length * 8 + 8}px` }}
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
          onContextMenu={(e) => handleContextMenu(e, item.type, item.id)}
        >
          {/* Indent Guide Lines */}
          {path.map((_, index) => (
            <div
              key={index}
              className={`absolute w-[1px] h-full top-0 
                ${isDarkMode ? "bg-[#404040]" : "bg-[#eaeaea]"}`}
              style={{ left: `${(index + 1) * 8}px` }}
            />
          ))}

          {/* File/Folder Icon and Name Container */}
          <div className="flex items-center min-w-0 h-[22px] relative">
            {/* Chevron for folders */}
            {item.type === "folder" && (
              <div className="absolute left-0">
                <ChevronRight
                  className={`w-4 h-4 transform transition-transform duration-100 
                    ${item.isOpen ? "rotate-90" : ""} 
                    ${
                      isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"
                    } opacity-70`}
                />
              </div>
            )}

            {/* Icon */}
            <div
              className={`flex-shrink-0 ${
                item.type === "folder" ? "ml-4" : "ml-4"
              }`}
            >
              <FileIcon
                filename={item.name}
                isFolder={item.type === "folder"}
                isOpen={item.type === "folder" && item.isOpen}
              />
            </div>

            {/* Name */}
            <div className="ml-1.5 flex-1 min-w-0">
              {isRenaming && renameItemId === item.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={submitRename}
                  className={`w-full px-1 py-0 h-[20px] outline-none border border-[#007fd4] rounded-[3px]
                    ${
                      isDarkMode
                        ? "bg-[#3c3c3c] text-[#cccccc]"
                        : "bg-white text-[#333333]"
                    }`}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`truncate select-none text-[13px] leading-[22px]
                    ${isDarkMode ? "text-[#cccccc]" : "text-[#333333]"}`}
                >
                  {item.name}
                </span>
              )}
            </div>

            {/* Hover Actions */}
            {item.type === "folder" && (
              <div
                className={`hidden group-hover:flex items-center space-x-1 ml-2 mr-1
                  ${isDarkMode ? "bg-[#2a2d2e]" : "bg-[#e8e8e9]"}`}
              >
                <button
                  onClick={(e) => handleCreateNew("file", item.id, e)}
                  className={`p-0.5 rounded-[3px] hover:bg-[#ffffff1f]
                    ${isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"}`}
                  title="New File"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleCreateNew("folder", item.id, e)}
                  className={`p-0.5 rounded-[3px] hover:bg-[#ffffff1f]
                    ${isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"}`}
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* New Item Input with Icon */}
        {isCreatingNew && creatingInFolderId === item.id && (
          <div
            className="relative"
            style={{ paddingLeft: `${(path.length + 1) * 8 + 8}px` }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-4 h-4 mr-1.5">
                {creationType === "file" ? (
                  <FileText
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"
                    }`}
                  />
                ) : (
                  <Folder
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"
                    }`}
                  />
                )}
              </div>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={submitNewItem}
                onBlur={() => {
                  setIsCreatingNew(false);
                  setNewItemName("");
                }}
                placeholder={
                  creationType === "file" ? "filename.js" : "foldername"
                }
                className={`flex-1 px-1 py-0 h-[22px] outline-none border border-[#007fd4] rounded-[3px] text-[13px]
                  ${
                    isDarkMode
                      ? "bg-[#3c3c3c] text-[#cccccc] placeholder-[#666666]"
                      : "bg-white text-[#333333] placeholder-[#999999]"
                  }`}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Nested Items */}
        {item.type === "folder" && item.isOpen && (
          <div className="relative">
            {renderFileTree(item.children || [], [...path, item.id])}
          </div>
        )}
      </div>
    ));
  };

  // Add findItem helper function
  const findItem = (items, id) => {
    for (let item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Add new helper functions for download and duplicate
  const downloadFile = (item) => {
    const blob = new Blob([item.content || ""], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadProject = () => {
    // Create a zip file containing all project files
    const zip = new JSZip();

    const addToZip = (items, currentPath = "") => {
      items.forEach((item) => {
        if (item.type === "file") {
          zip.file(currentPath + item.name, item.content || "");
        } else if (item.type === "folder") {
          const folderPath = currentPath + item.name + "/";
          item.children?.forEach((child) => addToZip([child], folderPath));
        }
      });
    };

    addToZip(files);

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  // Add new helper function for duplicating items
  const duplicateItem = (item, parentId = null) => {
    const newId = generateUniqueId();
    const getNewName = (name) => {
      const parts = name.split(".");
      if (parts.length > 1) {
        // For files with extension
        const ext = parts.pop();
        const baseName = parts.join(".");

        // Check if the name already ends with _copyX
        const copyMatch = baseName.match(/^(.*?)(?:_copy(\d+))?$/);
        const originalName = copyMatch[1];

        // Find existing copies to determine the next number
        const existingCopies = files
          .flatMap((item) => {
            const getAllFiles = (items) => {
              return items.flatMap((item) => {
                if (item.type === "folder" && item.children) {
                  return getAllFiles(item.children);
                }
                return item;
              });
            };
            return getAllFiles([item]);
          })
          .map((item) => {
            const match = item.name.match(
              new RegExp(`^${originalName}_copy(\\d+)\\.${ext}$`)
            );
            return match ? parseInt(match[1]) : 0;
          })
          .filter((num) => num > 0);

        const nextNumber =
          existingCopies.length > 0 ? Math.max(...existingCopies) + 1 : 1;
        return `${originalName}_copy${nextNumber}.${ext}`;
      }

      // For folders
      const folderMatch = name.match(/^(.*?)(?:_copy(\d+))?$/);
      const originalName = folderMatch[1];

      const existingCopies = files
        .flatMap((item) => {
          const getAllFolders = (items) => {
            return items.flatMap((item) => {
              const result = [item];
              if (item.type === "folder" && item.children) {
                result.push(...getAllFolders(item.children));
              }
              return result;
            });
          };
          return getAllFolders([item]);
        })
        .map((item) => {
          const match = item.name.match(
            new RegExp(`^${originalName}_copy(\\d+)$`)
          );
          return match ? parseInt(match[1]) : 0;
        })
        .filter((num) => num > 0);

      const nextNumber =
        existingCopies.length > 0 ? Math.max(...existingCopies) + 1 : 1;
      return `${originalName}_copy${nextNumber}`;
    };

    const duplicatedItem = {
      ...item,
      id: newId,
      name: getNewName(item.name),
      children: item.children
        ? item.children.map((child) => duplicateItem(child, newId))
        : null,
    };

    return duplicatedItem;
  };

  // Update setFiles to handle duplication
  const handleDuplicate = (id) => {
    setFiles((prevFiles) => {
      const duplicateInTree = (items, targetId) => {
        const result = [...items];
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === targetId) {
            const duplicated = duplicateItem(items[i]);
            result.splice(i + 1, 0, duplicated);
            return result;
          }
          if (items[i].children) {
            const newChildren = duplicateInTree(items[i].children, targetId);
            if (newChildren !== items[i].children) {
              result[i] = { ...items[i], children: newChildren };
              return result;
            }
          }
        }
        return result;
      };
      return duplicateInTree(prevFiles, id);
    });
  };

  // Add helper function to create zip for a folder
  const downloadFolderAsZip = (folder) => {
    const zip = new JSZip();

    const addToZip = (items, currentPath = "") => {
      items.forEach((item) => {
        if (item.type === "file") {
          zip.file(currentPath + item.name, item.content || "");
        } else if (item.type === "folder") {
          const folderPath = currentPath + item.name + "/";
          item.children?.forEach((child) => addToZip([child], folderPath));
        }
      });
    };

    addToZip([folder], "");

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folder.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div
      className={`w-60 h-full overflow-y-auto select-none relative
        ${isDarkMode ? "bg-[#252526]" : "bg-[#f3f3f3]"}`}
    >
      {/* Explorer Header */}
      <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          <span
            className={`text-[11px] uppercase tracking-wide font-semibold
              ${isDarkMode ? "text-[#bbbbbb]" : "text-[#6f6f6f]"}`}
          >
            Explorer
          </span>
          <div className="flex space-x-1">
            <button
              onClick={downloadProject}
              className={`p-1 rounded-[3px] hover:bg-[#ffffff1f]
                ${isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"}`}
              title="Download Project"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => handleCreateNew("file", null, e)}
              className={`p-1 rounded-[3px] hover:bg-[#ffffff1f]
                ${isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"}`}
              title="New File"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => handleCreateNew("folder", null, e)}
              className={`p-1 rounded-[3px] hover:bg-[#ffffff1f]
                ${isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"}`}
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className={`fixed z-50 min-w-[120px] py-1 rounded-[5px] shadow-lg
            ${
              isDarkMode
                ? "bg-[#252526] border border-[#454545]"
                : "bg-white border border-[#e4e4e4]"
            }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
              ${
                isDarkMode
                  ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                  : "hover:bg-[#e8e8e9] text-[#333333]"
              }`}
            onClick={() => {
              handleRename(contextMenu.targetId);
              closeContextMenu();
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </button>
          {contextMenu.type === "folder" && (
            <>
              <button
                className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
                  ${
                    isDarkMode
                      ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                      : "hover:bg-[#e8e8e9] text-[#333333]"
                  }`}
                onClick={(e) => {
                  handleCreateNew("file", contextMenu.targetId, e);
                  closeContextMenu();
                }}
              >
                <FilePlus className="w-4 h-4 mr-2" />
                New File
              </button>
              <button
                className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
                  ${
                    isDarkMode
                      ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                      : "hover:bg-[#e8e8e9] text-[#333333]"
                  }`}
                onClick={(e) => {
                  handleCreateNew("folder", contextMenu.targetId, e);
                  closeContextMenu();
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </button>
              <button
                className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
                  ${
                    isDarkMode
                      ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                      : "hover:bg-[#e8e8e9] text-[#333333]"
                  }`}
                onClick={() => {
                  const folder = findItem(files, contextMenu.targetId);
                  if (folder) downloadFolderAsZip(folder);
                  closeContextMenu();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download as ZIP
              </button>
            </>
          )}
          {contextMenu.type === "file" && (
            <button
              className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
                ${
                  isDarkMode
                    ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                    : "hover:bg-[#e8e8e9] text-[#333333]"
                }`}
              onClick={() => {
                const item = findItem(files, contextMenu.targetId);
                if (item) downloadFile(item);
                closeContextMenu();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          )}
          <button
            className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center
              ${
                isDarkMode
                  ? "hover:bg-[#2a2d2e] text-[#cccccc]"
                  : "hover:bg-[#e8e8e9] text-[#333333]"
              }`}
            onClick={() => {
              handleDuplicate(contextMenu.targetId);
              closeContextMenu();
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </button>
          <div
            className={`my-1 h-px ${
              isDarkMode ? "bg-[#454545]" : "bg-[#e4e4e4]"
            }`}
          />
          <button
            className={`w-full text-left px-3 py-[6px] text-[13px] flex items-center text-red-500
              ${isDarkMode ? "hover:bg-[#2a2d2e]" : "hover:bg-[#e8e8e9]"}`}
            onClick={() => {
              handleDelete(contextMenu.targetId);
              closeContextMenu();
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      )}

      {/* Root Level New Item Input with Icon */}
      {isCreatingNew && !creatingInFolderId && (
        <div className="px-4 mt-2">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-4 h-4 mr-1.5">
              {creationType === "file" ? (
                <FileText
                  className={`w-4 h-4 ${
                    isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"
                  }`}
                />
              ) : (
                <Folder
                  className={`w-4 h-4 ${
                    isDarkMode ? "text-[#c5c5c5]" : "text-[#424242]"
                  }`}
                />
              )}
            </div>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={submitNewItem}
              onBlur={() => {
                setIsCreatingNew(false);
                setNewItemName("");
              }}
              placeholder={
                creationType === "file" ? "filename.js" : "foldername"
              }
              className={`flex-1 px-1 py-0 h-[22px] outline-none border border-[#007fd4] rounded-[3px] text-[13px]
                ${
                  isDarkMode
                    ? "bg-[#3c3c3c] text-[#cccccc] placeholder-[#666666]"
                    : "bg-white text-[#333333] placeholder-[#999999]"
                }`}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="mt-1">{renderFileTree(files)}</div>
    </div>
  );
};
