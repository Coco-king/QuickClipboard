import React, { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/dashboardStore.js'
import Button from '@shared/components/ui/Button.jsx'
import ShortcutCard from './ShortcutCard.jsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

const ShortcutGrid = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [showAddShortcutModal, setShowAddShortcutModal] = useState(false)
  const [newShortcut, setNewShortcut] = useState({
    name: '',
    url: '',
    icon: 'ti ti-apps',
    runAsAdmin: false,
    args: ''
  })
  const nameInputRef = useRef(null)
  const modalRef = useRef(null)
  const currentWindow = getCurrentWindow()

  useEffect(() => {
    if (showAddShortcutModal && nameInputRef.current) {
      // 先聚焦窗口，再聚焦输入框
      setTimeout(async () => {
        try {
          // 手动聚焦窗口
          await currentWindow.setFocus()
          // 聚焦输入框
          nameInputRef.current.focus()
        } catch (error) {
          console.error('聚焦失败:', error)
          // 如果窗口聚焦失败，直接尝试聚焦输入框
          nameInputRef.current.focus()
        }
      }, 100)
    }
  }, [showAddShortcutModal])

  const handleAddShortcut = async () => {
    if (newShortcut.name.trim() && newShortcut.url.trim()) {
      await dashboardStore.addShortcut(snapshot.selectedGroupId, {
        name: newShortcut.name,
        url: newShortcut.url,
        icon: newShortcut.icon,
        runAsAdmin: newShortcut.runAsAdmin,
        args: newShortcut.args
      })
      setNewShortcut({name: '', url: '', icon: 'ti ti-apps', runAsAdmin: false, args: ''})
      setShowAddShortcutModal(false)
    }
  }

  return (
    <div className="shortcut-grid-content">
      {/* 快捷方式网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {snapshot.selectedGroup?.shortcuts.length > 0 ? (
          snapshot.selectedGroup.shortcuts.map((shortcut) => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              groupId={snapshot.selectedGroupId}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <i className="ti ti-apps text-6xl mb-4"></i>
            <p className="text-lg">此分组暂无快捷方式</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setShowAddShortcutModal(true)}
            >
              新建快捷方式
            </Button>
          </div>
        )}
      </div>

      {/* 添加快捷方式模态框 */}
      {showAddShortcutModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            // 点击背景不关闭模态框，但可以重新聚焦窗口
            currentWindow.setFocus().catch(err => console.error('聚焦窗口失败:', err))
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96"
            ref={modalRef}
            onClick={(e) => {
              e.stopPropagation() // 阻止事件冒泡到背景
              // 点击模态框内部时重新聚焦输入框
              if (nameInputRef.current) {
                nameInputRef.current.focus()
              }
            }}
          >
            <h3 className="text-lg font-semibold mb-4">新建快捷方式</h3>
            <div className="space-y-4">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="快捷方式名称"
                value={newShortcut.name}
                onChange={(e) => setNewShortcut({...newShortcut, name: e.target.value})}
                ref={nameInputRef}
                autoFocus
                onClick={(e) => {
                  e.stopPropagation()
                  // 确保点击输入框时窗口和输入框都有焦点
                  currentWindow.setFocus().then(() => {
                    e.target.focus()
                  }).catch(() => {
                    e.target.focus()
                  })
                }}
              />
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="应用程序路径"
                value={newShortcut.url}
                onChange={(e) => setNewShortcut({...newShortcut, url: e.target.value})}
                onClick={(e) => {
                  e.stopPropagation()
                  // 确保点击输入框时窗口和输入框都有焦点
                  currentWindow.setFocus().then(() => {
                    e.target.focus()
                  }).catch(() => {
                    e.target.focus()
                  })
                }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="runAsAdmin"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  checked={newShortcut.runAsAdmin}
                  onChange={(e) => setNewShortcut({...newShortcut, runAsAdmin: e.target.checked})}
                  onClick={(e) => {
                    e.stopPropagation()
                    // 确保点击复选框时窗口有焦点
                    currentWindow.setFocus().catch(() => {
                    })
                  }}
                />
                <label
                  htmlFor="runAsAdmin"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 确保点击标签时窗口有焦点
                    currentWindow.setFocus().catch(() => {
                    })
                  }}
                >以管理员身份运行
                </label>
              </div>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="运行参数 (可选)"
                value={newShortcut.args}
                onChange={(e) => setNewShortcut({...newShortcut, args: e.target.value})}
                onClick={(e) => {
                  e.stopPropagation()
                  // 确保点击输入框时窗口和输入框都有焦点
                  currentWindow.setFocus().then(() => {
                    e.target.focus()
                  }).catch(() => {
                    e.target.focus()
                  })
                }}
              />
              <div>
                <label className="block text-sm font-medium mb-2">图标</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="图标类名 (如: ti ti-apps)"
                  value={newShortcut.icon}
                  onChange={(e) => setNewShortcut({...newShortcut, icon: e.target.value})}
                  onClick={(e) => {
                    e.stopPropagation()
                    // 确保点击输入框时窗口和输入框都有焦点
                    currentWindow.setFocus().then(() => {
                      e.target.focus()
                    }).catch(() => {
                      e.target.focus()
                    })
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowAddShortcutModal(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleAddShortcut}
                disabled={!newShortcut.name.trim() || !newShortcut.url.trim()}
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShortcutGrid