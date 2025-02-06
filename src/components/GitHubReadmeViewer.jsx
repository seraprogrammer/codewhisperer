import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export const GitHubReadmeViewer = ({ isOpen, onClose, isDarkMode }) => {
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchReadmeContent();
    }
  }, [isOpen]);

  const fetchReadmeContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://raw.githubusercontent.com/seraprogrammer/mohona/main/index.html"
      );
      if (!response.ok) throw new Error("Failed to fetch README content");
      const content = await response.text();
      // Add custom scrollbar styles to the HTML content
      const styledContent = `
        <style>
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: ${isDarkMode ? "#1e1e1e" : "#f1f1f1"};
          }
          ::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? "#4a4a4a" : "#888"};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? "#555" : "#555"};
          }
          body {
            margin: 0;
            padding: 16px;
          }
        </style>
        ${content}
      `;
      setReadmeContent(styledContent);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[700px] transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } ${
        isDarkMode ? "bg-[#1e1e1e]" : "bg-white"
      } shadow-xl z-40 custom-scrollbar`}
      style={{
        "--scrollbar-width": "8px",
        "--scrollbar-track": isDarkMode ? "#1e1e1e" : "#f1f1f1",
        "--scrollbar-thumb": isDarkMode ? "#4a4a4a" : "#888",
        "--scrollbar-thumb-hover": isDarkMode ? "#555" : "#555",
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? "border-[#333333]" : "border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Preview
        </h2>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-md hover:bg-opacity-80 ${
            isDarkMode ? "hover:bg-[#333333]" : "hover:bg-gray-100"
          }`}
        >
          <X
            className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-600"}`}
          />
        </button>
      </div>

      {/* Content */}
      <div
        className="h-[calc(100%-4rem)] overflow-hidden"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isDarkMode ? "#4a4a4a #1e1e1e" : "#888 #f1f1f1",
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className={`animate-spin rounded-full h-8 w-8 border-2 ${
                isDarkMode
                  ? "border-white border-t-transparent"
                  : "border-gray-800 border-t-transparent"
              }`}
            />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <div className="h-full">
            <iframe
              srcDoc={readmeContent}
              className="w-full h-full border-none"
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: isDarkMode ? "#4a4a4a #1e1e1e" : "#888 #f1f1f1",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
