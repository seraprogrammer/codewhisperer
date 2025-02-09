import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Maximize2,
  Share2,
  Sun,
  Moon,
  Play,
  X,
  Files,
  Search,
  GitBranch,
  Bug,
  Box,
  FolderPlus,
  FileText,
  Settings,
  Save,
  Download,
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  Edit,
  Trash2,
  Package,
  FolderOpen,
  FilePlus,
  Check,
  ClipboardCopy,
  Terminal,
  Copy,
  Trash,
} from "lucide-react";
import { getIconForFile, getIconForFolder } from "vscode-icons-js";
import path from "path";
import "./App.css";
import { FileExplorerPanel } from "./components/FileExplorer";
import { SidebarNav } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { useFullscreen } from "./hooks/useFullscreen";
import { GitHubReadmeViewer } from "./components/GitHubReadmeViewer";
import { HtmlEditor } from "./components/HtmlEditor";

// Add these effects after other imports and before the App component
const STORAGE_KEYS = {
  FILES: "editore_files",
  OPEN_TABS: "editore_open_tabs",
  ACTIVE_TAB: "editore_active_tab",
  EDITOR_CONTENT: "editore_content",
};

// First, move the ContextMenu component outside of the App component
const ContextMenu = ({
  x,
  y,
  type,
  targetId,
  onClose,
  isDarkMode,
  handleRename,
  handleDelete,
  handleCreateInFolder,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      const rect = menu.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newY = y;
      let newX = x;

      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 5;
      }
      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 5;
      }

      menu.style.top = `${newY}px`;
      menu.style.left = `${newX}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 min-w-[160px] ${
        isDarkMode ? "bg-[#252526] text-gray-300" : "bg-white text-gray-800"
      } shadow-lg rounded-md py-1 border ${
        isDarkMode ? "border-[#3c3c3c]" : "border-gray-200"
      }`}
      onClick={(e) => e.stopPropagation()}
      style={{ position: "fixed", left: x, top: y }}
    >
      {type === "folder" && (
        <>
          <button
            onClick={() => {
              onClose();
              handleRename(targetId);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </button>
          <button
            onClick={() => {
              onClose();
              handleDelete(targetId);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm text-red-500 ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          <div
            className={`h-px my-1 ${
              isDarkMode ? "bg-[#3c3c3c]" : "bg-gray-200"
            }`}
          />
          <button
            onClick={() => {
              onClose();
              handleCreateInFolder(targetId, "file");
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <FileText className="w-4 h-4 mr-2" />
            New File
          </button>
          <button
            onClick={() => {
              onClose();
              handleCreateInFolder(targetId, "folder");
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </button>
        </>
      )}
      {type === "file" && (
        <>
          <button
            onClick={() => {
              onClose();
              handleRename(targetId);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </button>
          <button
            onClick={() => {
              onClose();
              handleDelete(targetId);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm text-red-500 ${
              isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
            } flex items-center`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </>
      )}
    </div>
  );
};

// File icons configuration
const fileIcons = {
  js: { color: "text-yellow-400", ext: "js" },
  jsx: { color: "text-blue-400", ext: "jsx" },
  css: { color: "text-blue-500", ext: "css" },
  html: { color: "text-orange-500", ext: "html" },
  json: { color: "text-yellow-200", ext: "json" },
  md: { color: "text-gray-400", ext: "md" },
  gitignore: { color: "text-gray-500", ext: "git" },
  config: { color: "text-gray-400", ext: "config" },
};

const getFileIcon = (filename) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return fileIcons[ext] || { color: "text-gray-400", ext: "file" };
};

// Sidebar component
const Sidebar = React.memo(
  ({
    activeTab,
    setActiveTab,
    isDarkMode,
    onExplorerClick,
    onSettingsClick,
    onGithubReadmeClick,
    onHtmlEditorClick,
  }) => {
    const tabs = [
      { id: "files", icon: Files, label: "Explorer", onClick: onExplorerClick },
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        onClick: onSettingsClick,
      },
      {
        id: "github-readme",
        icon: GitBranch,
        label: "GitHub README",
        onClick: onGithubReadmeClick,
      },
      {
        id: "html-editor",
        icon: FileText,
        label: "HTML Editor",
        onClick: onHtmlEditorClick,
      },
    ];

    return (
      <div
        className={`w-12 ${
          isDarkMode ? "bg-[#333333]" : "bg-gray-100"
        } flex flex-col items-center py-2 transition-all duration-300 ease-in-out`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "files") {
                  onExplorerClick();
                }
              }}
              className={`p-3 mb-1 relative group ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "bg-[#252526] text-white border-l-2 border-blue-500"
                    : "bg-white text-black border-l-2 border-blue-500"
                  : isDarkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-black"
              }`}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    );
  }
);

// FileTreeItem component
const FileTreeItem = React.memo(
  ({
    name,
    type,
    isOpen,
    children,
    isDarkMode,
    onRename,
    onDelete,
    onCreateFile,
    onCreateFolder,
    onClick,
  }) => {
    const [isExpanded, setIsExpanded] = React.useState(isOpen);
    const fileIcon = getFileIcon(name);

    return (
      <div>
        <div
          className={`flex items-center py-0.5 px-2 group cursor-pointer ${
            isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-200"
          }`}
        >
          <div
            className="flex-1 flex items-center"
            onClick={() => type === "folder" && setIsExpanded(!isExpanded)}
          >
            {type === "folder" ? (
              <span className="flex items-center">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-1 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1 text-gray-400" />
                )}
                <Folder
                  className={`w-4 h-4 mr-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                />
              </span>
            ) : (
              <span className="ml-5">
                <FileText className={`w-4 h-4 mr-1 ${fileIcon.color}`} />
              </span>
            )}
            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
              {name}
            </span>
          </div>

          {/* Hover Actions */}
          <div className="hidden group-hover:flex items-center space-x-1">
            {type === "folder" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile();
                  }}
                  className={`p-1 rounded-sm ${
                    isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-300"
                  }`}
                  title="New File"
                >
                  <FilePlus className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder();
                  }}
                  className={`p-1 rounded-sm ${
                    isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-300"
                  }`}
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-300"
              }`}
              title="Rename"
            >
              <Edit className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`p-1 rounded-sm ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-300"
              }`}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>
        {type === "folder" && isExpanded && (
          <div className="ml-4">{children}</div>
        )}
      </div>
    );
  }
);

// Add this helper function at the top level
const generateUniqueId = () =>
  `file_${Math.random().toString(36).substr(2, 9)}`;

// Update the FileExplorer component
const FileExplorer = React.memo(
  ({ isDarkMode, files, setFiles, onFileClick }) => {
    const [newItemName, setNewItemName] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [creationType, setCreationType] = useState(null); // "file" or "folder"
    const [currentPath, setCurrentPath] = useState([]);

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

    const renderFileTree = (items, path = []) => {
      return items.map((item) => (
        <FileTreeItem
          key={item.id}
          name={item.name}
          type={item.type}
          isOpen={item.isOpen}
          isDarkMode={isDarkMode}
          onRename={() => handleRename(item.id)}
          onDelete={() => handleDelete(item.id)}
          onCreateFile={() => handleCreateInFolder(item.id, "file")}
          onCreateFolder={() => handleCreateInFolder(item.id, "folder")}
          onClick={() => {
            if (item.type === "file") {
              onFileClick(item);
            }
          }}
        >
          {item.type === "folder" &&
            item.children &&
            renderFileTree(item.children, [...path, item.id])}
        </FileTreeItem>
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
            <span className="text-sm font-semibold">EXPLORER</span>
          </div>
          {renderFileTree(files)}
        </div>
      </div>
    );
  }
);

// Update the Tab component to receive isDarkMode as a prop
const Tab = ({ file, isActive, onClick, onClose, isDarkMode }) => {
  const fileIcon = getFileIcon(file.name);

  return (
    <div
      className={`flex items-center px-3 py-1.5 cursor-pointer border-t-2 max-w-[200px] group ${
        isActive
          ? `${
              isDarkMode
                ? "bg-[#1e1e1e] border-blue-500"
                : "bg-white border-blue-500"
            }`
          : `${
              isDarkMode
                ? "bg-[#2d2d2d] border-transparent"
                : "bg-gray-100 border-transparent"
            }`
      }`}
      onClick={onClick}
    >
      <span className={`mr-2 ${fileIcon.color}`}>
        <FileText className="w-4 h-4" />
      </span>
      <span className="truncate">{file.name}</span>
      <button
        className="ml-2 p-0.5 rounded-sm hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onClose(file.id, e);
        }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// Update the getDefaultSettings function to include IntelliSense settings
const getDefaultSettings = () => ({
  fontSize: 14,
  wordWrap: "on",
  minimap: {
    enabled: true,
    scale: 1,
    showSlider: "always",
    renderCharacters: false,
    maxColumn: 80,
  },
  lineNumbers: "on",
  tabSize: 2,
  cursorStyle: "line",
  cursorBlinking: "expand", // Smoother animation
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  mouseWheelZoom: true,
  padding: { top: 10 },
  renderLineHighlight: "all",
  matchBrackets: "always",
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  fontLigatures: true, // Enables font ligatures for better visuals
  bracketPairColorization: true,
  renderWhitespace: "all",
  stickyScroll: { enabled: true }, // Keeps function headers in view
  editorHover: { enabled: true, delay: 150, sticky: true }, // Enhanced hover animations
  animation: { enabled: true }, // Ensures smooth transitions
  tokenColorCustomizations: {
    comments: "#08ec00",
    functions: "#ffdd00",
    keywords: "#ff007f",
    variables: "#00ffff",
  },
  suggest: {
    showKeywords: true,
    showSnippets: true,
    showClasses: true,
    showFunctions: true,
    showVariables: true,
    showModules: true,
  },
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true,
  },
  parameterHints: {
    enabled: true,
    cycle: true,
  },
  snippetSuggestions: "top",
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: "on",
  inlineSuggest: {
    enabled: true,
  },
  wordBasedSuggestions: true,
  semanticHighlighting: true,
  editorRulers: [80, 100], // Guides for clean code formatting
  workbench: {
    colorTheme: "One Dark Pro", // Dark theme with animations
    iconTheme: "material-icon-theme",
    tree: {
      smoothScrolling: true, // Animated sidebar scrolling
    },
    sideBar: {
      animated: true, // Sidebar open/close animations
    },
    statusBar: {
      animated: true, // Status bar color changes smoothly
    },
  },
});

// Add this new function to define custom completions
const getCustomCompletions = (monaco) => {
  monaco.languages.registerCompletionItemProvider("javascript", {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: "obj",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const user = {",
            '\tname: "John Doe",',
            "\tage: 25,",
            '\tcity: "New York",',
            "\tgreet: function() {",
            "\t\tconsole.log(`Hello, my name is ${this.name} and I'm from ${this.city}.`);",
            "\t}",
            "};",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object",
          documentation: "Creates a basic object with key-value pairs.",
        },
        {
          label: "arr",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const numbers = [1, 2, 3, 4, 5];",
            "console.log(numbers);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array",
          documentation: "Creates a simple array with numbers.",
        },
        {
          label: "fn",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "function greet(name) {",
            "\treturn `Hello, ${name}!`;",
            "}",
            "console.log(greet('John'));",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Function",
          documentation: "Creates a basic function with a parameter.",
        },
        {
          label: "arrowfn",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const greet = (name) => `Hello, ${name}!`;",
            "console.log(greet('John'));",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Arrow Function",
          documentation: "Creates an arrow function.",
        },
        {
          label: "class",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "class Person {",
            "\tconstructor(name, age) {",
            "\t\tthis.name = name;",
            "\t\tthis.age = age;",
            "\t}",
            "\tgreet() {",
            "\t\tconsole.log(`Hello, my name is ${this.name}.`);",
            "\t}",
            "}",
            "const john = new Person('John', 25);",
            "john.greet();",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Class",
          documentation: "Creates a JavaScript class.",
        },
        {
          label: "promise",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const fetchData = () => {",
            "\treturn new Promise((resolve, reject) => {",
            "\t\tsetTimeout(() => {",
            '\t\t\tresolve("Data received!");',
            "\t\t}, 2000);",
            "\t});",
            "};",
            "fetchData().then(console.log);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Promise",
          documentation: "Creates a function returning a Promise.",
        },
        {
          label: "asyncfn",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "async function fetchData() {",
            "\treturn new Promise((resolve) => {",
            "\t\tsetTimeout(() => {",
            '\t\t\tresolve("Data received!");',
            "\t\t}, 2000);",
            "\t});",
            "}",
            "fetchData().then(console.log);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Async Function",
          documentation: "Creates an async function that returns a promise.",
        },
        {
          label: "map",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const numbers = [1, 2, 3, 4, 5];",
            "const doubled = numbers.map(num => num * 2);",
            "console.log(doubled);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array Map",
          documentation: "Maps over an array and doubles the values.",
        },
        {
          label: "filter",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const numbers = [1, 2, 3, 4, 5];",
            "const even = numbers.filter(num => num % 2 === 0);",
            "console.log(even);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array Filter",
          documentation: "Filters even numbers from an array.",
        },
        {
          label: "reduce",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const numbers = [1, 2, 3, 4, 5];",
            "const sum = numbers.reduce((acc, num) => acc + num, 0);",
            "console.log(sum);",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array Reduce",
          documentation: "Reduces an array to a sum.",
        },

        {
          label: "cl",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "console.log($0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "console.log()",
          documentation: "Quick console.log snippet",
        },
        {
          label: "ce",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "console.error($0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "console.error()",
          documentation: "Quick console.error snippet",
        },
        {
          label: "cw",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "console.warn($0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "console.warn()",
          documentation: "Quick console.warn snippet",
        },
        {
          label: "fn",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ["function ${1:name}(${2:params}) {", "\t$0", "}"].join(
            "\n"
          ),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Function definition",
          documentation: "Creates a new function",
        },
        {
          label: "af",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "(${1:params}) => ${2:expression}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Arrow function",
          documentation: "Creates an arrow function",
        },
        {
          label: "afn",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ["(${1:params}) => {", "\t$0", "}"].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Arrow function with block",
          documentation: "Creates an arrow function with block body",
        },
        {
          label: "iife",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ["(function() {", "\t$0", "})();"].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "IIFE",
          documentation: "Creates an immediately invoked function expression",
        },
        {
          label: "for",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {",
            "\t$0",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "For loop",
          documentation: "Creates a for loop",
        },
        {
          label: "foreach",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.forEach(${2:item} => $0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "forEach loop",
          documentation: "Creates a forEach loop",
        },
        {
          label: "map",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.map(${2:item} => $0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "map function",
          documentation: "Creates a map function",
        },
        {
          label: "filter",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.filter(${2:item} => $0);",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "filter function",
          documentation: "Creates a filter function",
        },
        {
          label: "reduce",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText:
            "${1:array}.reduce((${2:acc}, ${3:curr}) => $0, ${4:initial});",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "reduce function",
          documentation: "Creates a reduce function",
        },
        {
          label: "tc",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "try {",
            "\t$0",
            "} catch (error) {",
            "\tconsole.error(error);",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Try-catch block",
          documentation: "Creates a try-catch block",
        },
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ["if (${1:condition}) {", "\t$0", "}"].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "If statement",
          documentation: "Creates an if statement",
        },
        {
          label: "ife",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "if (${1:condition}) {",
            "\t$2",
            "} else {",
            "\t$0",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "If-else statement",
          documentation: "Creates an if-else statement",
        },

        // Object snippets
        {
          label: "obj",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "const ${1:objectName} = {",
            "\t${2:key}: ${3:value},$0",
            "};",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object declaration",
          documentation: "Creates a new object",
        },
        {
          label: "kv",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:key}: ${2:value},$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Key-value pair",
          documentation: "Adds a key-value pair",
        },
        {
          label: "ks",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "Object.keys(${1:object})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object.keys()",
          documentation: "Get object keys",
        },
        {
          label: "vs",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "Object.values(${1:object})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object.values()",
          documentation: "Get object values",
        },
        {
          label: "entries",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "Object.entries(${1:object})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object.entries()",
          documentation: "Get object entries",
        },
        {
          label: "assign",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "Object.assign({}, ${1:target}, ${2:source})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Object.assign()",
          documentation: "Merge objects",
        },

        // Array snippets
        {
          label: "arr",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "const ${1:arrayName} = [${2:items}]$0;",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array declaration",
          documentation: "Creates a new array",
        },
        {
          label: "push",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.push(${2:item})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.push()",
          documentation: "Add item to end of array",
        },
        {
          label: "pop",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.pop()$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.pop()",
          documentation: "Remove last item from array",
        },
        {
          label: "unshift",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.unshift(${2:item})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.unshift()",
          documentation: "Add item to start of array",
        },
        {
          label: "shift",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.shift()$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.shift()",
          documentation: "Remove first item from array",
        },
        {
          label: "slice",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.slice(${2:start}, ${3:end})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.slice()",
          documentation: "Extract portion of array",
        },
        {
          label: "splice",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText:
            "${1:array}.splice(${2:start}, ${3:deleteCount}, ${4:items})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.splice()",
          documentation: "Change contents of array",
        },
        {
          label: "sort",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.sort((a, b) => ${2:a - b})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.sort()",
          documentation: "Sort array with compare function",
        },
        {
          label: "find",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.find(${2:item} => ${3:condition})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.find()",
          documentation: "Find first matching element",
        },
        {
          label: "findIndex",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.findIndex(${2:item} => ${3:condition})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.findIndex()",
          documentation: "Find index of first matching element",
        },
        {
          label: "includes",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.includes(${2:item})$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.includes()",
          documentation: "Check if array includes item",
        },
        {
          label: "join",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "${1:array}.join('${2:,}')$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Array.join()",
          documentation: "Join array elements into string",
        },
        {
          label: "spread",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "[...${1:array}]$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: "Spread operator",
          documentation: "Spread array elements",
        },
      ];

      return { suggestions };
    },
  });
};

// Update the handleEditorDidMount function
const handleEditorDidMount = (editor, monaco) => {
  // Register custom completions
  getCustomCompletions(monaco);

  // Add extra libraries definitions for better IntelliSense
  const libSource = `
    declare class Console {
      log(...data: any[]): void;
      error(...data: any[]): void;
      warn(...data: any[]): void;
      info(...data: any[]): void;
    }
    declare const console: Console;
    
    interface Math {
      abs(x: number): number;
      ceil(x: number): number;
      floor(x: number): number;
      max(...values: number[]): number;
      min(...values: number[]): number;
      random(): number;
      round(x: number): number;
    }
    declare const Math: Math;
    
    interface Array<T> {
      length: number;
      map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
      filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
      forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
      reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
    }
  `;

  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    libSource,
    "global.d.ts"
  );

  // Configure JavaScript defaults
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true,
    typeRoots: ["node_modules/@types"],
  });
};

// Update the SettingsPanel component
const SettingsPanel = ({ settings, onUpdateSettings, isDarkMode }) => {
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [jsonEditorHeight, setJsonEditorHeight] = useState(400);
  const resizeRef = useRef(null);
  const startResizeRef = useRef(null);

  useEffect(() => {
    setJsonValue(JSON.stringify(settings, null, 2));
  }, [settings]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (startResizeRef.current) {
        const deltaY = e.clientY - startResizeRef.current;
        setJsonEditorHeight((prev) =>
          Math.max(200, Math.min(800, prev + deltaY))
        );
        startResizeRef.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      startResizeRef.current = null;
      document.body.style.cursor = "default";
    };

    if (startResizeRef.current !== null) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleJsonChange = (value) => {
    setJsonValue(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      onUpdateSettings("json", parsed);
    } catch (error) {
      setJsonError(error.message);
    }
  };

  const renderSettingItem = (label, control, description = "") => (
    <div
      className={`p-4 flex flex-col border-b ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      } hover:bg-opacity-50 ${
        isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-50"
      } transition-colors`}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <span
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {description}
            </span>
          )}
        </div>
        {control}
      </div>
    </div>
  );

  const inputClass = `px-2 py-1.5 rounded ${
    isDarkMode
      ? "bg-[#3c3c3c] border-gray-700 text-gray-200"
      : "bg-white border-gray-300"
  } border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`;

  return (
    <div
      className={`w-96 h-full overflow-hidden flex flex-col ${
        isDarkMode ? "bg-[#252526]" : "bg-white"
      }`}
    >
      <div
        className={`p-4 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold">Editor Settings</span>
          <button
            onClick={() => setIsJsonMode(!isJsonMode)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center space-x-2 ${
              isDarkMode
                ? "bg-[#3c3c3c] hover:bg-[#4c4c4c]"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {isJsonMode ? (
              <>
                <Settings className="w-4 h-4" />
                <span>UI Mode</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>JSON Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isJsonMode ? (
          <div className="h-full flex flex-col">
            <div
              className={`flex-1 relative ${
                isDarkMode ? "bg-[#1e1e1e]" : "bg-gray-50"
              }`}
              style={{ height: jsonEditorHeight }}
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonValue}
                onChange={handleJsonChange}
                theme={isDarkMode ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: "on",
                  folding: true,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "all",
                  matchBrackets: "always",
                  autoClosingBrackets: "always",
                  formatOnPaste: true,
                }}
              />
              {jsonError && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-xs">
                  {jsonError}
                </div>
              )}
            </div>
            <div
              ref={resizeRef}
              className={`h-1 cursor-ns-resize ${
                isDarkMode ? "bg-[#3c3c3c]" : "bg-gray-200"
              } hover:bg-blue-500 transition-colors`}
              onMouseDown={(e) => {
                startResizeRef.current = e.clientY;
                document.body.style.cursor = "ns-resize";
              }}
            />
            <div className={`p-4 ${isDarkMode ? "bg-[#252526]" : "bg-white"}`}>
              <h3 className="text-sm font-medium mb-2">Quick Help</h3>
              <ul
                className={`text-xs space-y-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <li>• Use valid JSON format</li>
                <li>• Press Ctrl+Space for suggestions</li>
                <li>• Changes are saved automatically</li>
              </ul>
            </div>
          </div>
        ) : (
          <div
            className={`overflow-y-auto h-full ${
              isDarkMode ? "text-gray-300" : "text-gray-800"
            }`}
          >
            {renderSettingItem(
              "Font Size",
              <input
                type="number"
                value={settings.fontSize}
                onChange={(e) =>
                  onUpdateSettings("fontSize", parseInt(e.target.value))
                }
                className={`w-20 ${inputClass}`}
                min="8"
                max="32"
              />,
              "Adjust the editor font size"
            )}

            {renderSettingItem(
              "Line Height",
              <input
                type="number"
                value={settings.lineHeight}
                onChange={(e) =>
                  onUpdateSettings("lineHeight", parseInt(e.target.value))
                }
                className={inputClass}
                min="100"
                max="200"
                step="10"
              />,
              "Adjust line height (percentage)"
            )}

            {renderSettingItem(
              "Font Family",
              <select
                value={settings.fontFamily}
                onChange={(e) => onUpdateSettings("fontFamily", e.target.value)}
                className={inputClass}
              >
                <option value="Consolas">Consolas</option>
                <option value="Menlo">Menlo</option>
                <option value="Monaco">Monaco</option>
                <option value="'Source Code Pro'">Source Code Pro</option>
                <option value="'Fira Code'">Fira Code</option>
              </select>,
              "Choose editor font family"
            )}

            {renderSettingItem(
              "Tab Size",
              <select
                value={settings.tabSize}
                onChange={(e) =>
                  onUpdateSettings("tabSize", parseInt(e.target.value))
                }
                className={inputClass}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </select>,
              "Set indentation size"
            )}

            {renderSettingItem(
              "Cursor Style",
              <select
                value={settings.cursorStyle}
                onChange={(e) =>
                  onUpdateSettings("cursorStyle", e.target.value)
                }
                className={inputClass}
              >
                <option value="line">Line</option>
                <option value="block">Block</option>
                <option value="underline">Underline</option>
                <option value="line-thin">Thin Line</option>
                <option value="block-outline">Block Outline</option>
                <option value="underline-thin">Thin Underline</option>
              </select>,
              "Choose cursor appearance"
            )}

            {renderSettingItem(
              "Format On Type",
              <input
                type="checkbox"
                checked={settings.formatOnType}
                onChange={(e) =>
                  onUpdateSettings("formatOnType", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300"
              />,
              "Format code while typing"
            )}

            {renderSettingItem(
              "Format On Paste",
              <input
                type="checkbox"
                checked={settings.formatOnPaste}
                onChange={(e) =>
                  onUpdateSettings("formatOnPaste", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300"
              />,
              "Format pasted code automatically"
            )}

            {renderSettingItem(
              "Smooth Cursor",
              <input
                type="checkbox"
                checked={settings.smoothCursor}
                onChange={(e) =>
                  onUpdateSettings("smoothCursor", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300"
              />,
              "Enable smooth cursor animation"
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add this new component for the "No file open" state
const NoFileOpen = ({ isDarkMode }) => (
  <div className="h-full flex flex-col items-center justify-center">
    <FileText
      className={`w-16 h-16 ${
        isDarkMode ? "text-gray-600" : "text-gray-400"
      } mb-4`}
    />
    <h2
      className={`text-xl ${
        isDarkMode ? "text-gray-400" : "text-gray-600"
      } mb-2`}
    >
      No file is open
    </h2>
    <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
      Open a file from the explorer to start editing
    </p>
  </div>
);

// Add this TreeView component before the OutputPanel component
const TreeView = ({ data, isDarkMode, renderValue, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isArray = Array.isArray(data);
  const isObject = typeof data === "object" && data !== null && !isArray;

  if (!isObject && !isArray) {
    return renderValue(data);
  }

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="ml-4">
      <div
        onClick={toggleExpand}
        className={`flex items-center cursor-pointer ${
          isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"
        }`}
      >
        <span className="mr-2">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </span>
        <span className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
          {isArray ? "[" : "{"}
        </span>
        {!isExpanded && (
          <span className="text-gray-500 ml-1">
            {isArray
              ? `${data.length} items`
              : `${Object.keys(data).length} properties`}
          </span>
        )}
        {!isExpanded && (
          <span className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
            {isArray ? "]" : "}"}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="ml-4">
          {isArray
            ? data.map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-gray-500 mr-2">{index}:</span>
                  {typeof item === "object" && item !== null ? (
                    <TreeView
                      data={item}
                      isDarkMode={isDarkMode}
                      renderValue={renderValue}
                      depth={depth + 1}
                    />
                  ) : (
                    renderValue(item)
                  )}
                </div>
              ))
            : Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex items-start">
                  <span
                    className={`${
                      isDarkMode ? "text-purple-400" : "text-purple-600"
                    } mr-2`}
                  >
                    {key}:
                  </span>
                  {typeof value === "object" && value !== null ? (
                    <TreeView
                      data={value}
                      isDarkMode={isDarkMode}
                      renderValue={renderValue}
                      depth={depth + 1}
                    />
                  ) : (
                    renderValue(value)
                  )}
                </div>
              ))}
          <div className="ml-[-1rem]">
            <span className={isDarkMode ? "text-blue-400" : "text-blue-600"}>
              {isArray ? "]" : "}"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced OutputPanel with better organization
const OutputPanel = ({ output, onClear, isDarkMode }) => {
  const [filter, setFilter] = useState("all"); // 'all', 'string', 'number', 'object', 'array'
  const [searchTerm, setSearchTerm] = useState("");
  const [timeStamps, setTimeStamps] = useState(true);
  const [copySuccess, setCopySuccess] = useState("");

  const renderValue = (value) => {
    if (typeof value === "string") {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-400">{`"${value}"`}</span>
          <span className="text-gray-500 text-xs">(String)</span>
        </div>
      );
    }
    if (typeof value === "number") {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-orange-400">{value}</span>
          <span className="text-gray-500 text-xs">(Number)</span>
        </div>
      );
    }
    if (typeof value === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">{String(value)}</span>
          <span className="text-gray-500 text-xs">(Boolean)</span>
        </div>
      );
    }
    if (value === null) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">null</span>
          <span className="text-gray-500 text-xs">(Null)</span>
        </div>
      );
    }
    if (value === undefined) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">undefined</span>
          <span className="text-gray-500 text-xs">(Undefined)</span>
        </div>
      );
    }
    if (Array.isArray(value)) {
      return (
        <TreeView
          data={value}
          isDarkMode={isDarkMode}
          renderValue={renderValue}
        />
      );
    }
    if (typeof value === "object") {
      return (
        <TreeView
          data={value}
          isDarkMode={isDarkMode}
          renderValue={renderValue}
        />
      );
    }
    return String(value);
  };

  const parseOutput = (output) => {
    try {
      return output.split("\n").map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return line;
        }
      });
    } catch {
      return output;
    }
  };

  const filterOutput = (items) => {
    return items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "string") return typeof item === "string";
      if (filter === "number") return typeof item === "number";
      if (filter === "object")
        return (
          typeof item === "object" && !Array.isArray(item) && item !== null
        );
      if (filter === "array") return Array.isArray(item);
      return true;
    });
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof output === "string" ? output : JSON.stringify(output, null, 2)
      );
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      setCopySuccess("Failed to copy");
    }
  };

  const outputData = parseOutput(output);
  const filteredOutput = filterOutput(outputData);

  return (
    <div
      className={`h-full flex flex-col ${
        isDarkMode ? "bg-[#1e1e1e]" : "bg-white"
      }`}
    >
      <div
        className={`flex flex-col border-b ${
          isDarkMode ? "border-[#333333]" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-3">
            <span
              className={`font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Console Output
            </span>
            <div
              className={`px-2 py-0.5 rounded-full text-xs ${
                isDarkMode
                  ? "bg-[#2d2d2d] text-gray-400"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filteredOutput.length}{" "}
              {filter === "all" ? "messages" : filter + "s"}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {copySuccess && (
              <span className="text-xs text-green-500 mr-2">{copySuccess}</span>
            )}
            <button
              onClick={handleCopyOutput}
              className={`p-1.5 rounded-md ${
                isDarkMode
                  ? "hover:bg-[#333333] text-gray-400 hover:text-gray-200"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title="Copy Output"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
            <button
              onClick={onClear}
              className={`p-1.5 rounded-md ${
                isDarkMode
                  ? "hover:bg-[#333333] text-gray-400 hover:text-gray-200"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-opacity-50">
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`text-sm rounded-md border ${
                isDarkMode
                  ? "bg-[#2d2d2d] border-[#444444] text-gray-300"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <option value="all">All Types</option>
              <option value="string">Strings</option>
              <option value="number">Numbers</option>
              <option value="object">Objects</option>
              <option value="array">Arrays</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={timeStamps}
                onChange={(e) => setTimeStamps(e.target.checked)}
                className="rounded"
              />
              <span
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Show Timestamps
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Content */}
      <div
        className={`flex-1 p-4 font-mono text-sm overflow-auto ${
          isDarkMode ? "text-gray-300" : "text-gray-800"
        }`}
      >
        {output ? (
          <div
            className={`rounded-lg ${
              isDarkMode ? "bg-[#2d2d2d]" : "bg-gray-50"
            } p-3`}
          >
            {filteredOutput.map((item, index) => (
              <div key={index} className="mb-2 group">
                {timeStamps && (
                  <span className="text-xs text-gray-500 mr-2">
                    {new Date().toLocaleTimeString()}
                  </span>
                )}
                <div className="flex items-center">
                  <div className="flex-1">{renderValue(item)}</div>
                  <div
                    className={`opacity-0 group-hover:opacity-100 flex items-center space-x-2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          typeof item === "object"
                            ? JSON.stringify(item, null, 2)
                            : String(item)
                        );
                      }}
                      className="p-1 hover:bg-opacity-20 hover:bg-gray-500 rounded"
                      title="Copy value"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Terminal
              className={`w-8 h-8 ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}
            />
            <span className="text-gray-400">No output to display</span>
            <span className="text-xs text-gray-500">
              Run your code to see the results here
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage, default to true if not set
    const savedMode = localStorage.getItem("isDarkMode");
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  // Add effect to save dark mode preference
  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editorValue, setEditorValue] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [isOutputVisible, setIsOutputVisible] = useState(true);
  const [outputWidth, setOutputWidth] = useState(50);
  const resizeRef = useRef(null);
  const containerRef = useRef(null);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [files, setFiles] = useState(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
    return savedFiles
      ? JSON.parse(savedFiles)
      : [
          {
            id: "1",
            name: "app.js",
            type: "file",
            content: "// Welcome to app.js",
          },
          {
            id: "2",
            name: "main.js",
            type: "file",
            content: "// Main file content",
          },
          {
            id: "3",
            name: "src",
            type: "folder",
            isOpen: true,
            children: [
              {
                id: "4",
                name: "utils.js",
                type: "file",
                content: "// Utility functions",
              },
            ],
          },
        ];
  });
  const [openTabs, setOpenTabs] = useState(() => {
    const savedTabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
    return savedTabs ? JSON.parse(savedTabs) : [];
  });
  const [activeTab, setActiveTab] = useState("explorer");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [currentPath, setCurrentPath] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    type: null,
    targetId: null,
  });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [activeTabId, setActiveTabId] = useState(() => {
    const savedActiveTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    return savedActiveTab || null;
  });
  const [editorContent, setEditorContent] = useState(() => {
    const savedContent = localStorage.getItem(STORAGE_KEYS.EDITOR_CONTENT);
    return savedContent || "// Start coding here...";
  });
  const { toggleFullscreen, isFullscreen } = useFullscreen();
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(() => {
    // Initialize from localStorage, default to false if not set
    const savedLiveMode = localStorage.getItem("isLiveMode");
    return savedLiveMode !== null ? JSON.parse(savedLiveMode) : false;
  });
  const liveUpdateTimeoutRef = useRef(null);

  // Update the editorSettings state initialization
  const [editorSettings, setEditorSettings] = useState(() => {
    const savedSettings = localStorage.getItem("editorSettings");
    return savedSettings ? JSON.parse(savedSettings) : getDefaultSettings();
  });

  // Add this effect to save settings to localStorage
  useEffect(() => {
    localStorage.setItem("editorSettings", JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Update the settings handler
  const handleUpdateSettings = (key, value) => {
    setEditorSettings((prev) => {
      if (key === "json") {
        // Handle complete JSON update
        return { ...getDefaultSettings(), ...value };
      }
      // Handle individual setting update
      return { ...prev, [key]: value };
    });
  };

  // Base editor options
  const baseEditorOptions = {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    scrollbar: {
      vertical: "visible",
      horizontal: "visible",
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      alwaysConsumeMouseWheel: false,
    },
    overviewRulerLanes: 3,
    find: {
      addExtraSpaceOnTop: true,
    },
  };

  // Combined editor options
  const editorOptions = {
    ...baseEditorOptions,
    fontSize: editorSettings.fontSize,
    wordWrap: editorSettings.wordWrap,
    minimap: { enabled: editorSettings.minimap },
    lineNumbers: editorSettings.lineNumbers,
    tabSize: editorSettings.tabSize,
    cursorStyle: editorSettings.cursorStyle,
    cursorBlinking: editorSettings.cursorBlinking,
    formatOnSave: editorSettings.formatOnSave,
    bracketPairColorization: {
      enabled: editorSettings.bracketPairColorization,
    },
    autoClosingBrackets: editorSettings.autoClosingBrackets,
    smoothScrolling: editorSettings.smoothScrolling,
  };

  const handleEditorChange = (value) => {
    console.log("Editor content changed:", value);
    setEditorContent(value);

    // Update the content in openTabs
    if (activeTabId) {
      setOpenTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId ? { ...tab, content: value } : tab
        )
      );

      // Also update the file content in the files array
      setFiles((prevFiles) => {
        const updateFileContent = (items) => {
          return items.map((item) => {
            if (item.id === activeTabId) {
              return { ...item, content: value };
            }
            if (item.children) {
              return { ...item, children: updateFileContent(item.children) };
            }
            return item;
          });
        };
        return updateFileContent(prevFiles);
      });
    }

    if (isLiveMode) {
      handleLiveUpdate(value);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Register custom completions
    getCustomCompletions(monaco);

    // Add extra libraries definitions for better IntelliSense
    const libSource = `
      declare class Console {
        log(...data: any[]): void;
        error(...data: any[]): void;
        warn(...data: any[]): void;
        info(...data: any[]): void;
      }
      declare const console: Console;
      
      interface Math {
        abs(x: number): number;
        ceil(x: number): number;
        floor(x: number): number;
        max(...values: number[]): number;
        min(...values: number[]): number;
        random(): number;
        round(x: number): number;
      }
      declare const Math: Math;
      
      interface Array<T> {
        length: number;
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
        filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
        forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
        reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
      }
    `;

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      libSource,
      "global.d.ts"
    );

    // Configure JavaScript defaults
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });
  };

  const handleRunCode = () => {
    try {
      const consoleOutput = [];
      const mockConsole = {
        log: (...args) => {
          args.forEach((arg) => {
            if (typeof arg === "object" && arg !== null) {
              consoleOutput.push(JSON.stringify(arg));
            } else {
              consoleOutput.push(String(arg));
            }
          });
        },
        error: (...args) => {
          consoleOutput.push(`Error: ${args.join(" ")}`);
        },
      };

      const func = new Function("console", editorContent);
      func(mockConsole);
      setOutput(consoleOutput.join("\n"));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Custom resize handle component
  function ResizeHandle() {
    return (
      <PanelResizeHandle
        className={`w-1.5 ${
          isDarkMode
            ? "hover:bg-blue-600 bg-[#3c3c3c]"
            : "hover:bg-blue-400 bg-gray-200"
        }`}
      />
    );
  }

  const toggleFolder = (folderId) => {
    setFiles((prevFiles) => {
      const updateFiles = (items) => {
        return items.map((item) => {
          if (item.id === folderId && item.type === "folder") {
            return { ...item, isOpen: !item.isOpen };
          }
          if (item.children) {
            return { ...item, children: updateFiles(item.children) };
          }
          return item;
        });
      };
      return updateFiles(prevFiles);
    });
  };

  const handleFileClick = (file) => {
    console.log("Handling file click:", file);

    // Check if the file is already open
    const existingTab = openTabs.find((tab) => tab.id === file.id);

    if (!existingTab) {
      // Add new tab if it doesn't exist
      setOpenTabs((prev) => [
        ...prev,
        {
          id: file.id,
          name: file.name,
          content: file.content,
          type: file.type,
          path: file.name,
        },
      ]);
    }

    // Set this file as active
    setActiveTabId(file.id);
    setEditorContent(file.content);
  };

  const handleTabClose = (tabId, event) => {
    if (event) {
      event.stopPropagation();
    }

    setOpenTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId);

      // If we're closing the active tab
      if (activeTabId === tabId) {
        // Switch to the last tab if available
        if (newTabs.length > 0) {
          const lastTab = newTabs[newTabs.length - 1];
          setActiveTabId(lastTab.id);
          setEditorContent(lastTab.content);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, lastTab.id);
          localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, lastTab.content);
        } else {
          // No tabs left
          setActiveTabId(null);
          setEditorContent("// Start coding here...");
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
          localStorage.setItem(
            STORAGE_KEYS.EDITOR_CONTENT,
            "// Start coding here..."
          );
        }
      }

      return newTabs;
    });
  };

  const handleCreateInFolder = (parentId, type) => {
    setIsCreatingFile(type === "file");
    setIsCreatingFolder(type === "folder");
    setNewItemName("");

    if (parentId) {
      const findPath = (items, targetId, currentPath = []) => {
        for (const item of items) {
          if (item.id === targetId) {
            return [...currentPath, item.id];
          }
          if (item.children) {
            const path = findPath(item.children, targetId, [
              ...currentPath,
              item.id,
            ]);
            if (path) return path;
          }
        }
        return null;
      };

      const path = findPath(files, parentId) || [parentId];
      setCurrentPath(path);

      setFiles((prevFiles) => {
        const openFolders = (items, pathToOpen) => {
          return items.map((item) => {
            if (pathToOpen.includes(item.id)) {
              return {
                ...item,
                isOpen: true,
                children: item.children
                  ? openFolders(item.children, pathToOpen)
                  : [],
              };
            }
            return item;
          });
        };
        return openFolders(prevFiles, path);
      });
    } else {
      setCurrentPath([]);
    }
    closeContextMenu();
  };

  const createNewItem = (type) => {
    if (!newItemName.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name:
        type === "file"
          ? newItemName.includes(".")
            ? newItemName
            : `${newItemName}.js`
          : newItemName,
      type: type,
      content: type === "file" ? "// New file" : "",
      ...(type === "folder" && { children: [], isOpen: true }),
    };

    setFiles((prevFiles) => {
      const addItemToPath = (items, path) => {
        if (path.length === 0) {
          return [...items, newItem];
        }

        return items.map((item) => {
          if (item.id === path[0]) {
            return {
              ...item,
              isOpen: true,
              children: [...(item.children || []), newItem],
            };
          }
          if (item.children) {
            return {
              ...item,
              children: addItemToPath(item.children, path.slice(1)),
            };
          }
          return item;
        });
      };

      return addItemToPath(prevFiles, currentPath);
    });

    setNewItemName("");
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
  };

  const getIconPath = (filename, isFolder = false) => {
    if (isFolder) {
      return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjZThlOGU4IiBkPSJNMTQuNCA0SDguOEw3LjIgMi40SDEuNkMuNzIgMi40IDAgMy4xMiAwIDRWMTJDMCAxMi44OC43MiAxMy42IDEuNiAxMy42SDE0LjRDMTUuMjggMTMuNiAxNiAxMi44OCAxNiAxMlY1LjZDMTYgNC43MiAxNS4yOCA0IDE0LjQgNFoiLz48L3N2Zz4=";
    }
    const ext = filename.split(".").pop()?.toLowerCase();
    // Add more file type icons as needed
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjYzVjNWM1IiBkPSJNMTMuNSAzSDguOEw3LjEgMS4zSDIuNUMxLjcgMS4zIDEgMiAxIDIuOHYxMC40YzAgLjguNyAxLjUgMS41IDEuNWgxMGMuOCAwIDEuNS0uNyAxLjUtMS41VjQuNWMwLS44LS43LTEuNS0xLjUtMS41eiIvPjwvc3ZnPg==";
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

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };

    const handleGlobalContextMenu = (e) => {
      // Prevent default context menu only in the file explorer area
      if (e.target.closest(".file-explorer")) {
        e.preventDefault();
      }
    };

    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("contextmenu", handleGlobalContextMenu);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, [contextMenu.show]);

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
    closeContextMenu();
  };

  const submitRename = () => {
    if (!renameValue.trim()) return;

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
  };

  const handleDelete = (id) => {
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
    closeContextMenu();
  };

  const toggleExplorer = () => {
    setIsExplorerOpen(!isExplorerOpen);
  };

  // Handle code sharing
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Update the settings click handler
  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setActiveTab("settings");
    // Close explorer when opening settings
    setIsExplorerOpen(false);
  };

  // Update the handlers
  const handleExplorerClick = () => {
    setIsExplorerOpen(!isExplorerOpen);
    setActiveTab("files");
    // Close settings when opening explorer
    setIsSettingsOpen(false);
  };

  const handleLiveUpdate = useCallback((value) => {
    if (liveUpdateTimeoutRef.current) {
      clearTimeout(liveUpdateTimeoutRef.current);
    }

    liveUpdateTimeoutRef.current = setTimeout(() => {
      try {
        const consoleOutput = [];
        const mockConsole = {
          log: (...args) => {
            args.forEach((arg) => {
              if (typeof arg === "object" && arg !== null) {
                consoleOutput.push(JSON.stringify(arg));
              } else {
                consoleOutput.push(String(arg));
              }
            });
          },
          error: (...args) => {
            consoleOutput.push(`Error: ${args.join(" ")}`);
          },
        };

        const func = new Function("console", value);
        func(mockConsole);
        setOutput(consoleOutput.join("\n"));
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
    }, 500);
  }, []);

  // Add effect to save live mode preference
  useEffect(() => {
    localStorage.setItem("isLiveMode", JSON.stringify(isLiveMode));
  }, [isLiveMode]);

  // Keep the save effects
  useEffect(() => {
    console.log("Saving files:", files);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    console.log("Saving tabs:", openTabs);
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(openTabs));
  }, [openTabs]);

  useEffect(() => {
    if (activeTabId) {
      console.log("Saving active tab:", activeTabId);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTabId);
    }
  }, [activeTabId]);

  useEffect(() => {
    console.log("Saving editor content:", editorContent);
    localStorage.setItem(STORAGE_KEYS.EDITOR_CONTENT, editorContent);
  }, [editorContent]);

  // Add an effect to restore the active tab's content
  useEffect(() => {
    if (activeTabId) {
      const activeTab = openTabs.find((tab) => tab.id === activeTabId);
      if (activeTab) {
        setEditorContent(activeTab.content);
      }
    }
  }, [activeTabId, openTabs]);

  const clearLocalStorage = () => {
    const confirmation = window.confirm(
      "Are you sure you want to clear all stored data? This will reset the editor to its initial state."
    );
    if (confirmation) {
      Object.keys(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(STORAGE_KEYS[key]);
      });
      window.location.reload();
    }
  };

  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  const handleGithubReadmeClick = () => {
    setIsReadmeOpen(true);
    setActiveTab("github-readme");
  };

  // Add this state near your other useState declarations
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);

  // Add this handler function with your other handlers
  const handleHtmlEditorClick = () => {
    setIsHtmlEditorOpen(true);
    setActiveTab("html-editor");
  };

  return (
    <div
      className={`h-screen flex ${
        isDarkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-gray-800"
      }`}
    >
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        onExplorerClick={handleExplorerClick}
        onSettingsClick={handleSettingsClick}
        onGithubReadmeClick={handleGithubReadmeClick}
        onHtmlEditorClick={handleHtmlEditorClick}
      />

      {/* Show FileExplorer */}
      {isExplorerOpen && activeTab !== "collab" && (
        <FileExplorerPanel
          isDarkMode={isDarkMode}
          files={files}
          setFiles={setFiles}
          onFileClick={handleFileClick}
        />
      )}

      {/* Show Settings */}
      {isSettingsOpen && activeTab !== "collab" && (
        <SettingsPanel
          settings={editorSettings}
          onUpdateSettings={handleUpdateSettings}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div
          className={`flex items-center justify-between px-4 py-2 ${
            isDarkMode
              ? "bg-[#1e1e1e] border-b border-[#333333]"
              : "bg-white border-b border-gray-200"
          }`}
        >
          <TabBar
            tabs={openTabs}
            activeTabId={activeTabId}
            onTabClick={(tabId) => {
              setActiveTabId(tabId);
              const tab = openTabs.find((t) => t.id === tabId);
              if (tab) setEditorContent(tab.content);
            }}
            onTabClose={handleTabClose}
            isDarkMode={isDarkMode}
          />
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-colors ${
                isLiveMode
                  ? isDarkMode
                    ? "bg-green-600 text-white"
                    : "bg-green-500 text-white"
                  : isDarkMode
                  ? "hover:bg-[#333333] text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title={
                isLiveMode ? "Disable Live Updates" : "Enable Live Updates"
              }
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isLiveMode
                    ? "bg-white animate-pulse"
                    : isDarkMode
                    ? "bg-gray-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="text-sm">Live</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode
                  ? "hover:bg-[#333333] text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode
                  ? "hover:bg-[#333333] text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title={isCopied ? "Copied!" : "Copy Code"}
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode
                  ? "hover:bg-[#333333] text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              }`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-gray-300" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleRunCode}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Run</span>
            </button>
            <button
              onClick={clearLocalStorage}
              className={`p-1.5 rounded-md ${
                isDarkMode
                  ? "hover:bg-[#333333] text-red-400"
                  : "hover:bg-gray-200 text-red-500"
              }`}
              title="Clear Local Storage"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={70} minSize={30}>
              {openTabs.length > 0 ? (
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={editorContent}
                  onChange={handleEditorChange}
                  theme={isDarkMode ? "vs-dark" : "light"}
                  options={editorOptions}
                  onMount={handleEditorDidMount}
                />
              ) : (
                <NoFileOpen isDarkMode={isDarkMode} />
              )}
            </Panel>

            <PanelResizeHandle
              className={`w-1.5 ${
                isDarkMode
                  ? "hover:bg-blue-600 bg-[#3c3c3c]"
                  : "hover:bg-blue-400 bg-gray-200"
              }`}
            />

            <Panel defaultSize={30} minSize={20}>
              <OutputPanel
                output={output}
                onClear={() => setOutput("")}
                isDarkMode={isDarkMode}
              />
            </Panel>
          </PanelGroup>
        </div>
      </div>
      <GitHubReadmeViewer
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        isDarkMode={isDarkMode}
      />
      <HtmlEditor
        isOpen={isHtmlEditorOpen}
        onClose={() => setIsHtmlEditorOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
