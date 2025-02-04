import React from "react";
import { X } from "lucide-react";
import { FileIcon } from "./FileIcon";

export const TabBar = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  isDarkMode,
}) => {
  return (
    <div
      className={`flex overflow-x-auto ${
        isDarkMode ? "bg-[#252526]" : "bg-gray-100"
      }`}
    >
      {tabs.map((tab) => {
        return (
          <div
            key={tab.id}
            className={`flex items-center px-3 py-1.5 cursor-pointer border-t-2 max-w-[200px] group ${
              activeTabId === tab.id
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
            onClick={() => onTabClick(tab.id)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <div className="mr-2 flex-shrink-0">
                <FileIcon filename={tab.name} />
              </div>
              <span
                className={`truncate ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {tab.name}
              </span>
            </div>
            <button
              className={`ml-2 p-0.5 rounded-sm hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100 flex-shrink-0 ${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id, e);
              }}
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
