import React, { useEffect, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import Button from '@shared/components/ui/Button.jsx';
import Input from '@shared/components/ui/Input.jsx';
import Textarea from '@shared/components/ui/Textarea.jsx';
import Toggle from '@shared/components/ui/Toggle.jsx';
import IconSelector from '@shared/components/ui/IconSelector.jsx';

const ShortcutEdit = ({isVisible, mode, shortcut, onClose, onSave}) => {
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState({
    id: '',
    name: '',
    url: '',
    icon: 'ti ti-apps',
    runAsAdmin: false,
    args: ''
  });
  const currentWindow = getCurrentWindow();
  const runAsAdminToggleRef = useRef(null);

  useEffect(() => {
    if (shortcut) {
      setCurrentShortcut({
        id: shortcut.id || '',
        name: shortcut.name || '',
        url: shortcut.url || '',
        icon: shortcut.icon || 'ti ti-apps',
        originalIcon: shortcut.icon || 'ti ti-apps',
        runAsAdmin: shortcut.runAsAdmin || false,
        args: shortcut.args || ''
      });
    } else {
      setCurrentShortcut({
        id: '',
        name: '',
        url: '',
        icon: 'ti ti-apps',
        runAsAdmin: false,
        args: ''
      });
    }
  }, [shortcut, mode]);

  const browseForFile = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [
          // {name: '应用程序', extensions: ['exe', 'lnk']},
          {name: '所有文件', extensions: ['*']}
        ]
      });
      if (file) {
        await handleUrlChange(file);
      }
    } catch (error) {
      console.error('选择文件失败:', error);
    }
  };

  const handleSave = () => {
    if (currentShortcut.name.trim() && currentShortcut.url.trim()) {
      onSave(currentShortcut);
    }
  };

  // 处理应用程序路径变化，自动获取图标
  const handleUrlChange = async (url) => {
    setCurrentShortcut(prev => ({...prev, url}))

    // 当输入的路径看起来是一个有效的文件路径时，自动获取图标
    if (url && (url.endsWith('.exe') || url.endsWith('.lnk') || url.includes('\\') || url.includes('/'))) {
      try {
        const icon = await invoke('get_app_icon', {path: url, size: 64})
        if (icon) {
          setCurrentShortcut(prev => ({...prev, icon}))
        } else {
          setCurrentShortcut(prev => ({...prev, icon: 'ti ti-apps'}))
        }
      } catch (error) {
        console.error('获取应用程序图标失败:', error)
        // 失败时保持默认图标
      }
    }
  }

  if (!isVisible) return null;

  return (
    <>
      {/* 快捷方式模态框 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={() => currentWindow.setFocus().catch(err => console.error('聚焦窗口失败:', err))}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[480px] transition-all duration-300 transform scale-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <i className={`${mode === 'add' ? 'ti ti-apps' : 'ti ti-pencil'} text-blue-600 dark:text-blue-400 text-xl`}></i>
            </div>
            <h3 className="text-xl font-bold">{mode === 'add' ? '新建快捷方式' : '编辑快捷方式'}</h3>
          </div>

          <div className="space-y-4">
            {/* 名称和图标 */}
            <div className="flex items-center gap-5">
              <div className="flex-1">
                <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">名称</div>
                <Input
                  id="shortcut-name-input"
                  type="text"
                  className="w-full"
                  placeholder="输入快捷方式名称"
                  value={currentShortcut.name}
                  onChange={(e) => setCurrentShortcut({...currentShortcut, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="w-15 h-15">
                {currentShortcut.icon.startsWith("ti") ? (<i className={`${currentShortcut.icon} text-6xl`}></i>) : (<img src={currentShortcut.icon} alt="图标" className="w-full h-full object-contain"/>)}
              </div>
            </div>

            {/* 图标操作按钮 */}
            <div className="w-full">
              <div className="mt-1 flex items-end justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCurrentShortcut({...currentShortcut, icon: currentShortcut.originalIcon})}
                >
                  默认图标
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowIconSelector(true)}
                >
                  更换图标
                </Button>
              </div>
            </div>

            {/* 目标路径 */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">目标</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={browseForFile}
                  className="flex items-center gap-1"
                >
                  <i className="ti ti-folder-open"></i>
                  浏览
                </Button>
              </div>
              <Textarea
                id="shortcut-path-input"
                value={currentShortcut.url}
                className="w-full resize-y min-h-[80px]"
                placeholder="请输入目标路径"
                rows="3"
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>

            {/* 参数 */}
            <div className="w-full">
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">参数</div>
              <Textarea
                id="shortcut-arguments-input"
                value={currentShortcut.args}
                placeholder="可选"
                className="w-full resize-y min-h-[80px]"
                rows="3"
                onChange={(e) => setCurrentShortcut({...currentShortcut, args: e.target.value})}
              />
            </div>

            {/* 管理员权限 */}
            <div className="flex h-10 items-center gap-3">
              <div className="flex items-center gap-2 py-2">
                <Toggle
                  ref={runAsAdminToggleRef}
                  checked={currentShortcut.runAsAdmin}
                  onChange={(value) => setCurrentShortcut({...currentShortcut, runAsAdmin: value})}
                />
                <div onClick={() => runAsAdminToggleRef.current?.click()} className="mb-2 text-sm cursor-pointer font-medium text-gray-700 dark:text-gray-300">始终以管理员权限启动</div>
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="w-20"></div>
            <div className="w-full flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!currentShortcut.name.trim() || !currentShortcut.url.trim()}
              >
                {mode === 'add' ? '创建' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 图标选择器 */}
      <IconSelector
        isVisible={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(icon) => setCurrentShortcut({...currentShortcut, icon})}
        title="选择图标"
      />
    </>
  );
};

export default ShortcutEdit;