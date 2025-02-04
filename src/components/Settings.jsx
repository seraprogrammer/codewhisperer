import React from "react";
import { Slider } from "./ui/Slider";
import { Select } from "./ui/Select";
import { Switch } from "./ui/Switch";

export const SettingsPanel = ({ settings, onUpdateSettings, isDarkMode }) => {
  const renderSettingItem = (label, control) => (
    <div
      className={`p-4 flex justify-between items-center border-b ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <span className="text-sm">{label}</span>
      {control}
    </div>
  );

  const inputClass = `px-2 py-1 rounded ${
    isDarkMode
      ? "bg-[#3c3c3c] border-gray-700 text-gray-200"
      : "bg-white border-gray-300"
  } border`;

  return (
    <div
      className={`w-60 h-full overflow-y-auto ${
        isDarkMode ? "bg-[#252526]" : "bg-white"
      }`}
    >
      <div className="p-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">SETTINGS</span>
        </div>

        <div className={`${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
          {renderSettingItem(
            "Font Size",
            <input
              type="number"
              value={settings.fontSize}
              onChange={(e) =>
                onUpdateSettings("fontSize", parseInt(e.target.value))
              }
              className={`w-20 ${inputClass}`}
            />
          )}

          {renderSettingItem(
            "Word Wrap",
            <select
              value={settings.wordWrap}
              onChange={(e) => onUpdateSettings("wordWrap", e.target.value)}
              className={inputClass}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          )}

          {renderSettingItem(
            "Minimap",
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => onUpdateSettings("minimap", e.target.checked)}
              className="w-4 h-4"
            />
          )}

          {renderSettingItem(
            "Line Numbers",
            <select
              value={settings.lineNumbers}
              onChange={(e) => onUpdateSettings("lineNumbers", e.target.value)}
              className={inputClass}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="relative">Relative</option>
            </select>
          )}

          {renderSettingItem(
            "Tab Size",
            <input
              type="number"
              value={settings.tabSize}
              onChange={(e) =>
                onUpdateSettings("tabSize", parseInt(e.target.value))
              }
              className={`w-20 ${inputClass}`}
            />
          )}

          {renderSettingItem(
            "Format On Save",
            <input
              type="checkbox"
              checked={settings.formatOnSave}
              onChange={(e) =>
                onUpdateSettings("formatOnSave", e.target.checked)
              }
              className="w-4 h-4"
            />
          )}

          {renderSettingItem(
            "Bracket Pair Colorization",
            <input
              type="checkbox"
              checked={settings.bracketPairColorization}
              onChange={(e) =>
                onUpdateSettings("bracketPairColorization", e.target.checked)
              }
              className="w-4 h-4"
            />
          )}

          {renderSettingItem(
            "Auto Closing Brackets",
            <select
              value={settings.autoClosingBrackets}
              onChange={(e) =>
                onUpdateSettings("autoClosingBrackets", e.target.value)
              }
              className={inputClass}
            >
              <option value="always">Always</option>
              <option value="never">Never</option>
            </select>
          )}

          {renderSettingItem(
            "Smooth Scrolling",
            <input
              type="checkbox"
              checked={settings.smoothScrolling}
              onChange={(e) =>
                onUpdateSettings("smoothScrolling", e.target.checked)
              }
              className="w-4 h-4"
            />
          )}

          {renderSettingItem(
            "Cursor Style",
            <select
              value={settings.cursorStyle}
              onChange={(e) => onUpdateSettings("cursorStyle", e.target.value)}
              className={inputClass}
            >
              <option value="line">Line</option>
              <option value="block">Block</option>
              <option value="underline">Underline</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
};
