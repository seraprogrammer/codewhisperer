import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
  Copy,
  Search,
  Filter,
  Clock,
  Save,
  Trash2,
  Check,
  Download,
  MessageSquare,
  Terminal,
} from "lucide-react";

export const OutputPanel = ({ output, onClear, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [outputHistory, setOutputHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isCopied, setIsCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleInput, setConsoleInput] = useState("");

  // Add output to history when it changes
  React.useEffect(() => {
    if (output) {
      setOutputHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date(),
          content: output,
          type: output.startsWith("Error:") ? "error" : "log",
        },
      ]);
    }
  }, [output]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    try {
      // eslint-disable-next-line no-eval
      const result = eval(consoleInput);
      setOutputHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date(),
          content: JSON.stringify(result),
          type: "log",
          input: consoleInput,
        },
      ]);
    } catch (error) {
      setOutputHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date(),
          content: error.message,
          type: "error",
          input: consoleInput,
        },
      ]);
    }
    setConsoleInput("");
  };

  const filteredHistory = outputHistory.filter((entry) => {
    if (selectedFilter !== "all" && entry.type !== selectedFilter) return false;
    if (
      searchTerm &&
      !String(entry.content).toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const formatOutput = (value) => {
    try {
      // If it's an error message
      if (typeof value === "string" && value.startsWith("Error:")) {
        return <div className="text-red-500 font-mono text-sm">{value}</div>;
      }

      // If it's an array or object
      if (
        typeof value === "string" &&
        (value.startsWith("[") || value.startsWith("{"))
      ) {
        const parsed = JSON.parse(value);
        return (
          <div className="font-mono text-sm">
            {JSON.stringify(parsed, null, 2)}
          </div>
        );
      }

      // Default output
      return <div className="font-mono text-sm">{value}</div>;
    } catch {
      // If parsing fails, return as plain text
      return <div className="font-mono text-sm">{value}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className={`flex-none border-b ${
          isDarkMode
            ? "bg-[#1e1e1e] border-[#3c3c3c]"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 rounded-md transition-colors ${
                isDarkMode ? "hover:bg-[#3c3c3c]" : "hover:bg-gray-200"
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <span className="font-semibold text-sm">Output</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {showFilter && (
              <div className="flex items-center mr-2">
                <div
                  className={`relative rounded-md ${
                    isDarkMode ? "bg-[#2d2d2d]" : "bg-white"
                  }`}
                >
                  <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className={`w-40 pl-8 pr-2 py-1 text-sm rounded-md border ${
                      isDarkMode
                        ? "bg-[#2d2d2d] border-[#3c3c3c] text-gray-300"
                        : "bg-white border-gray-200 text-gray-800"
                    }`}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-1.5 rounded-md transition-colors ${
                showFilter
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                  ? "text-gray-400 hover:bg-[#3c3c3c]"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title="Toggle Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`p-1.5 rounded-md transition-colors ${
                showConsole
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                  ? "text-gray-400 hover:bg-[#3c3c3c]"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title="Toggle Console"
            >
              <Terminal className="w-4 h-4" />
            </button>
            {output && (
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-md transition-colors ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-[#3c3c3c]"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                title={isCopied ? "Copied!" : "Copy Output"}
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => {
                onClear();
                setOutputHistory([]);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode
                  ? "text-gray-400 hover:bg-[#3c3c3c]"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              title="Clear Output"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Output Content */}
      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="p-4">
              {output ? (
                <div
                  className={`rounded-md ${
                    output.startsWith("Error:")
                      ? isDarkMode
                        ? "bg-red-500/10"
                        : "bg-red-50"
                      : isDarkMode
                      ? "bg-[#2d2d2d]"
                      : "bg-gray-50"
                  } p-3`}
                >
                  {formatOutput(output)}
                </div>
              ) : (
                <div
                  className={`flex items-center justify-center h-20 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  <span className="text-sm">No output to display</span>
                </div>
              )}
            </div>
          </div>

          {/* Console Input */}
          {showConsole && (
            <div
              className={`flex-none border-t ${
                isDarkMode ? "border-[#3c3c3c]" : "border-gray-200"
              }`}
            >
              <form onSubmit={handleConsoleSubmit} className="p-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-mono ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    ›
                  </span>
                  <input
                    type="text"
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    placeholder="Enter JavaScript code..."
                    className={`flex-1 bg-transparent border-none outline-none text-sm font-mono ${
                      isDarkMode
                        ? "text-gray-300 placeholder-gray-600"
                        : "text-gray-800 placeholder-gray-400"
                    }`}
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// JsonView component for handling JSON/Array output
const JsonView = ({ data, isDarkMode, initialExpanded = false, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);

  if (Array.isArray(data)) {
    return (
      <div className="ml-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded hover:${
              isDarkMode ? "bg-[#3c3c3c]" : "bg-gray-200"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          <span className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
            Array({data.length})
          </span>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-gray-700">
            {data.map((item, index) => (
              <div key={index} className="flex items-start py-1">
                <span
                  className={`mr-2 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {index}:
                </span>
                {typeof item === "object" ? (
                  <JsonView
                    data={item}
                    isDarkMode={isDarkMode}
                    depth={depth + 1}
                  />
                ) : (
                  <span className={`${getValueColor(item, isDarkMode)}`}>
                    {formatValue(item)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className="ml-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded hover:${
              isDarkMode ? "bg-[#3c3c3c]" : "bg-gray-200"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          <span
            className={`${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
          >
            Object
          </span>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-gray-700">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="flex items-start py-1">
                <span
                  className={`mr-2 ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                >
                  {key}:
                </span>
                {typeof value === "object" ? (
                  <JsonView
                    data={value}
                    isDarkMode={isDarkMode}
                    depth={depth + 1}
                  />
                ) : (
                  <span className={`${getValueColor(value, isDarkMode)}`}>
                    {formatValue(value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <span className={`${getValueColor(data, isDarkMode)}`}>
      {formatValue(data)}
    </span>
  );
};

// Helper functions for formatting and coloring values
const getValueColor = (value, isDarkMode) => {
  if (typeof value === "string")
    return isDarkMode ? "text-green-400" : "text-green-600";
  if (typeof value === "number")
    return isDarkMode ? "text-blue-400" : "text-blue-600";
  if (typeof value === "boolean")
    return isDarkMode ? "text-purple-400" : "text-purple-600";
  if (value === null) return isDarkMode ? "text-gray-400" : "text-gray-600";
  return isDarkMode ? "text-gray-300" : "text-gray-800";
};

const formatValue = (value) => {
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return String(value);
};
