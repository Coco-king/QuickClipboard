import React, { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/dashboardStore.js'
import Button from '@shared/components/ui/Button.jsx'
import Input from '@shared/components/ui/Input.jsx'
import Textarea from '@shared/components/ui/Textarea.jsx'
import Toggle from '@shared/components/ui/Toggle.jsx'
import IconSelector from '@shared/components/ui/IconSelector.jsx'
import ShortcutCard from './ShortcutCard.jsx'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

const ShortcutGrid = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' 或 'edit'
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [currentShortcut, setCurrentShortcut] = useState({
    id: '',
    name: '',
    url: '',
    icon: 'ti ti-apps',
    runAsAdmin: false,
    args: ''
  })
  const [editingShortcut, setEditingShortcut] = useState(null)
  const nameInputRef = useRef(null)
  const modalRef = useRef(null)
  const currentWindow = getCurrentWindow()

  // 统一浏览文件函数
  const browseForFile = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [
          {name: '应用程序', extensions: ['exe', 'lnk']},
          {name: '所有文件', extensions: ['*']}
        ]
      })
      if (file) {
        setCurrentShortcut({...currentShortcut, url: file})
      }
    } catch (error) {
      console.error('选择文件失败:', error)
    }
  }

  useEffect(() => {
    if (showModal && nameInputRef.current) {
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
  }, [showModal])

  // 处理应用程序路径变化，自动获取图标
  const handleUrlChange = async (e) => {
    const url = e.target.value
    setCurrentShortcut({...currentShortcut, url})

    // 当输入的路径看起来是一个有效的文件路径时，自动获取图标
    if (url && (url.endsWith('.exe') || url.endsWith('.lnk') || url.includes('\\') || url.includes('/'))) {
      try {
        const icon = await invoke('get_app_icon', {path: url, size: 64})
        if (icon) {
          setCurrentShortcut({...currentShortcut, url, icon})
        }
      } catch (error) {
        console.error('获取应用程序图标失败:', error)
        // 失败时保持默认图标
      }
    }
  }

  // 打开添加模态框
  const openAddModal = () => {
    setModalMode('add')
    setCurrentShortcut({
      id: '',
      name: '',
      url: '',
      icon: 'ti ti-apps',
      runAsAdmin: false,
      args: ''
    })
    setShowModal(true)
  }

  // 打开编辑模态框
  const openEditModal = (shortcut) => {
    setModalMode('edit')
    setEditingShortcut(shortcut)
    setCurrentShortcut({
      id: shortcut.id,
      name: shortcut.name,
      url: shortcut.url || shortcut.path,
      icon: shortcut.icon,
      runAsAdmin: shortcut.runAsAdmin || false,
      args: shortcut.args || ''
    })
    setShowModal(true)
  }

  // 处理图标选择
  const handleIconSelect = (icon) => {
    setCurrentShortcut({...currentShortcut, icon})
    setShowIconSelector(false)
  }

  // 保存快捷方式
  const handleSave = async () => {
    if (currentShortcut.name.trim() && currentShortcut.url.trim()) {
      if (modalMode === 'add') {
        await dashboardStore.addShortcut(snapshot.selectedGroupId, {
          name: currentShortcut.name,
          url: currentShortcut.url,
          icon: currentShortcut.icon,
          runAsAdmin: currentShortcut.runAsAdmin,
          args: currentShortcut.args
        })
      } else if (modalMode === 'edit' && editingShortcut) {
        await dashboardStore.editShortcut(snapshot.selectedGroupId, editingShortcut.id, {
          ...editingShortcut,
          ...currentShortcut
        })
      }
      setShowModal(false)
      setEditingShortcut(null)
    }
  }

  return (
    <div className="shortcut-grid-content">

      {/* 快捷方式网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {snapshot.selectedGroup?.shortcuts.length > 0 ? (
          snapshot.selectedGroup.shortcuts.map((shortcut) => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              onDelete={() => dashboardStore.deleteShortcut(snapshot.selectedGroupId, shortcut.id)}
              onEdit={openEditModal}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-60 text-gray-500 dark:text-gray-400">
            <i className="ti ti-apps text-6xl mb-4 opacity-70"></i>
            <p className="text-base mb-6 text-center max-w-[300px] leading-relaxed">此分组暂无快捷方式</p>
            <Button
              variant="secondary"
              className="mt-2"
              onClick={openAddModal}
            >
              新建快捷方式
            </Button>
          </div>
        )}
      </div>

      {/* 统一快捷方式模态框 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            // 点击背景不关闭模态框，但可以重新聚焦窗口
            currentWindow.setFocus().catch(err => console.error('聚焦窗口失败:', err))
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[480px] transition-all duration-300 transform scale-100"
            ref={modalRef}
            onClick={(e) => {
              e.stopPropagation() // 阻止事件冒泡到背景
              // 点击模态框内部时重新聚焦输入框
              if (nameInputRef.current) {
                nameInputRef.current.focus()
              }
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <i className={`${modalMode === 'add' ? 'ti ti-apps' : 'ti ti-pencil'} text-blue-600 dark:text-blue-400 text-xl`}></i>
              </div>
              <h3 className="text-xl font-bold">{modalMode === 'add' ? '新建快捷方式' : '编辑快捷方式'}</h3>
            </div>

            <div className="space-y-4">
              {/* 第一行：快捷方式名称和图标 */}
              <div className="flex items-center gap-5">
                <div className="flex-1">
                  <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">名称</div>
                  <div>
                    <Input
                      id="shortcut-name-input"
                      type="text"
                      className="w-full"
                      placeholder="输入快捷方式名称"
                      value={currentShortcut.name}
                      onChange={(e) => setCurrentShortcut({...currentShortcut, name: e.target.value})}
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
                  </div>
                </div>

                {/* 图标部分 */}
                <div className="w-16 h-16 flex items-center justify-center rounded-md text-3xl bg-gray-50 dark:bg-gray-700 transition-all duration-200">
                  {currentShortcut.icon.startsWith("ti") ? (<i className={currentShortcut.icon || "ti ti-star"}></i>) : (<img src={currentShortcut.icon} alt="图标" className="w-full h-full object-contain"/>)}
                </div>
              </div>

              {/* 第二行：图标操作按钮 */}
              <div className="w-full">
                <div className="mt-1 flex items-end justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      // 恢复默认图标功能
                      setCurrentShortcut({...currentShortcut, icon: 'ti ti-file'})
                    }}
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

              {/* 第三行：目标路径 */}
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
                  onChange={handleUrlChange}
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

              {/* 第四行：参数 */}
              <div className="w-full">
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">参数</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">可选</div>
                <Textarea
                  id="shortcut-arguments-input"
                  value={currentShortcut.args}
                  className="w-full resize-y min-h-[80px]"
                  rows="3"
                  onChange={(e) => setCurrentShortcut({...currentShortcut, args: e.target.value})}
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

              {/* 第七行：管理员权限选项 */}
              <div className="flex h-10 items-center gap-3">
                <div className="w-20"></div>
                <div className="w-full">
                  <div className="flex items-center gap-2 py-2">
                    <Toggle
                      checked={currentShortcut.runAsAdmin}
                      onChange={(value) => setCurrentShortcut({...currentShortcut, runAsAdmin: value})}
                    />
                    <label
                      htmlFor="runAsAdmin"
                      className="cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        // 确保点击标签时窗口有焦点
                        currentWindow.setFocus().catch(() => {
                        })
                      }}
                    >
                      始终以管理员权限启动
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 第八行：确认和取消按钮 */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="w-20"></div>
              <div className="w-full flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!currentShortcut.name.trim() || !currentShortcut.url.trim()}
                >
                  {modalMode === 'add' ? '创建' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图标选择器 */}
      <IconSelector
        open={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={(icon) => setCurrentShortcut({...currentShortcut, icon})}
        title="选择图标"
      />
    </div>
  )
}

export default ShortcutGrid