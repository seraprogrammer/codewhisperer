import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export const HtmlEditor = ({ isOpen, onClose, isDarkMode }) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHtmlContent();
    }
  }, [isOpen]);

  const fetchHtmlContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://raw.githubusercontent.com/seraprogrammer/Extensions/main/htmleditor.html"
      );
      if (!response.ok) throw new Error("Failed to fetch HTML content");
      const content = await response.text();
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
      setHtmlContent(styledContent);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isDarkMode ? "bg-[#1e1e1e]" : "bg-white"
      }`}
    >
      {/* Header */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b ${
          isDarkMode ? "border-[#333333]" : "border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          HTML Editor
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-md hover:bg-opacity-80 ${
            isDarkMode ? "hover:bg-[#333333]" : "hover:bg-gray-100"
          }`}
        >
          <X
            className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-600"}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-4rem)] overflow-hidden">
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
              srcDoc={htmlContent}
              className="w-full h-full border-none"
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
};
