import React, { useState } from 'react';
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import { ICONS } from '@shared/config/icons';
import Button from "@shared/components/ui/Button.jsx";
import Input from "@shared/components/ui/Input.jsx";

/**
 * 通用图标选择器组件
 * @param {Object} props
 * @param {boolean} props.isVisible - 控制选择器是否显示
 * @param {function} props.onClose - 关闭选择器的回调函数
 * @param {function} props.onSelect - 选择图标后的回调函数
 * @param {string} props.title - 选择器标题，默认"选择图标"
 */
const IconSelector = ({isVisible, onClose, onSelect, title = "选择图标"}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isVisible) return null;

  // 过滤图标列表
  const filteredIcons = ICONS.filter(icon => {
    const iconName = icon.replace('ti ti-', '').toLowerCase();
    return iconName.includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-180 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>

          <div className="flex items-end justify-end gap-2">
            {/* 搜索输入框 */}
            <Input
              type="text"
              placeholder="搜索图标..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button onClick={onClose}>
              <i className="ti ti-x text-2xl"></i>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-4">
          {filteredIcons.length > 0 ? (
            filteredIcons.map((icon, index) => (
              <button
                key={index}
                className="flex items-center justify-center w-12 h-12 rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                onClick={() => {
                  onSelect(icon);
                  onClose();
                }}
                title={icon.replace('ti ti-', '')}
              >
                <i className={`${icon} text-2xl`}></i>
              </button>
            ))
          ) : (
            <div className="col-span-8 flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <i className="ti ti-search text-4xl mb-2"></i>
                <p>未找到匹配的图标</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconSelector;