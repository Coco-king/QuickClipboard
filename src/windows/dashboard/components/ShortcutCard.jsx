import React, { useState } from 'react'
import { dashboardStore } from '@shared/store/dashboardStore.js'
import Button from '@shared/components/ui/Button.jsx'
import { createMenuItem, createSeparator, showContextMenuFromEvent } from '@/plugins/context_menu/index.js'

const ShortcutCard = ({shortcut, groupId}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({...shortcut, url: shortcut.url || shortcut.path, runAsAdmin: shortcut.runAsAdmin || false, args: shortcut.args || shortcut.args || ''})

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (editData.name.trim() && editData.url.trim()) {
      await dashboardStore.editShortcut(groupId, shortcut.id, {
        name: editData.name,
        url: editData.url,
        icon: editData.icon,
        runAsAdmin: editData.runAsAdmin,
        args: editData.args
      })
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('确定要删除此快捷方式吗？')) {
      await dashboardStore.deleteShortcut(groupId, shortcut.id)
    }
  }

  const handleRun = async () => {
    // 使用Tauri的shell API来执行文件
    try {
      const {shell} = await import('@tauri-apps/api')
      const command = shortcut.url || shortcut.path
      const args = shortcut.args ? shortcut.args.split(' ') : []

      await shell.open(command, {
        args,
        withParent: true
      })

      console.log('运行快捷方式:', shortcut)
    } catch (error) {
      console.error('运行快捷方式失败:', error)
    }
  }

  // 打开文件所在位置
  const openFileLocation = async () => {
    try {
      const {shell} = await import('@tauri-apps/api')
      const command = shortcut.url || shortcut.path

      // 获取文件所在目录
      const path = require('path')
      const dirName = path.dirname(command)

      await shell.open(dirName, {
        withParent: true
      })

      console.log('打开文件所在位置:', dirName)
    } catch (error) {
      console.error('打开文件所在位置失败:', error)
    }
  }

  // 以管理员身份运行
  const runAsAdministrator = async () => {
    try {
      const {shell} = await import('@tauri-apps/api')
      const command = shortcut.url || shortcut.path
      const args = shortcut.args ? shortcut.args.split(' ') : []

      // 注意：Tauri的shell.open目前不支持直接以管理员身份运行
      // 这里我们可以使用PowerShell命令来实现
      const powerShellArgs = ['-Command', `Start-Process -FilePath "${command}" -ArgumentList @(${args.map(arg => `"${arg}"`).join(', ')}) -Verb RunAs`]

      await shell.execute('powershell.exe', powerShellArgs, {
        withParent: true
      })

      console.log('以管理员身份运行:', shortcut)
    } catch (error) {
      console.error('以管理员身份运行失败:', error)
    }
  }

  const handleContextMenu = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const menuItems = [
      createMenuItem('edit', '编辑', {icon: 'ti ti-pencil'}),
      createMenuItem('delete', '删除', {icon: 'ti ti-trash'}),
      createSeparator(),
      createMenuItem('openLocation', '打开文件所在位置', {icon: 'ti ti-folder-open'}),
      createSeparator(),
      createMenuItem('run', '运行快捷方式', {icon: 'ti ti-play'}),
      createMenuItem('runAsAdmin', '以管理员身份运行', {icon: 'ti ti-shield'})
    ]

    const result = await showContextMenuFromEvent(event, menuItems)
    if (!result) return

    switch (result) {
      case 'run':
        await handleRun()
        break
      case 'runAsAdmin':
        await runAsAdministrator()
        break
      case 'openLocation':
        await openFileLocation()
        break
      case 'edit':
        handleEdit()
        break
      case 'delete':
        handleDelete()
        break
    }
  }

  return (
    <div className="shortcut-card bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transition-all duration-200 hover:shadow-lg" onContextMenu={handleContextMenu}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="快捷方式名称"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            autoFocus
          />
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="应用程序路径"
            value={editData.url}
            onChange={(e) => setEditData({...editData, url: e.target.value})}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="runAsAdmin"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              checked={editData.runAsAdmin}
              onChange={(e) => setEditData({...editData, runAsAdmin: e.target.checked})}
            />
            <label htmlFor="runAsAdmin" className="text-sm font-medium text-gray-700 dark:text-gray-300">以管理员身份运行</label>
          </div>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="运行参数 (可选)"
            value={editData.args}
            onChange={(e) => setEditData({...editData, args: e.target.value})}
          />
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="图标类名"
            value={editData.icon}
            onChange={(e) => setEditData({...editData, icon: e.target.value})}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!editData.name.trim() || !editData.url.trim()}>
              保存
            </Button>
          </div>
        </div>
      ) : (
        <div className="shortcut-card-content">
          <div
            className="shortcut-icon text-3xl mb-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={handleRun}
          >
            <i className={shortcut.icon}></i>
          </div>
          <div className="shortcut-name font-medium text-center truncate mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={handleRun}>
            {shortcut.name}
          </div>
          <div className="shortcut-actions flex justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              icon={<i className="ti ti-pencil"></i>}
            />
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<i className="ti ti-trash"></i>}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ShortcutCard