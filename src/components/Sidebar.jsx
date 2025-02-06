import React from "react";
import { Files, Settings, BookOpen, Code2 } from "lucide-react";

export const SidebarNav = ({
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
      id: "html-editor",
      icon: Code2,
      label: "HTML Editor",
      onClick: onHtmlEditorClick,
    },
    {
      id: "github-readme",
      icon: BookOpen,
      label: "GitHub README",
      onClick: onGithubReadmeClick,
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      onClick: onSettingsClick,
    },
  ];

  return (
    <div
      className={`w-12 ${
        isDarkMode ? "bg-[#333333]" : "bg-gray-100"
      } flex flex-col items-center py-2`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.onClick) {
                tab.onClick();
              } else {
                setActiveTab(tab.id);
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
};
