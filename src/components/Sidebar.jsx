import React from "react";
import {
  Files,
  Settings,
  Search,
  GitBranch,
  Bug,
  Package,
  Users,
} from "lucide-react";

export const SidebarNav = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  onExplorerClick,
  onSettingsClick,
}) => {
  const tabs = [
    { id: "files", icon: Files, label: "Explorer", onClick: onExplorerClick },
    { id: "collab", icon: Users, label: "Collaborative Editor" },
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
