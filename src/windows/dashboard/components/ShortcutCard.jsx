import React from 'react'
import { createMenuItem, createSeparator, showContextMenuFromEvent } from '@/plugins/context_menu/index.js'

const ShortcutCard = ({ shortcut, onDelete, onEdit }) => {
  const handleDelete = () => {
    onDelete(shortcut.id)
  }
  
  // 处理快捷方式运行
  const handleRun = async () => {
    try {
      const {shell} = await import('@tauri-apps/api')
      const command = shortcut.url || shortcut.path
      const args = shortcut.args ? shortcut.args.split(' ') : []

      await shell.open(command, {
        args,
        withParent: true
      })
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

      // 使用PowerShell命令来以管理员身份运行
      const powerShellArgs = ['-Command', `Start-Process -FilePath "${command}" -ArgumentList @(${args.map(arg => `"${arg}"`).join(', ')}) -Verb RunAs`]

      await shell.execute('powershell.exe', powerShellArgs, {
        withParent: true
      })
    } catch (error) {
      console.error('以管理员身份运行失败:', error)
    }
  }
  
  // 处理右键菜单
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
        onEdit(shortcut)
        break
      case 'delete':
        handleDelete()
        break
    }
  }

  return (
    <div className="relative group bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transition-all duration-250 hover:shadow-xl hover:-translate-y-1 overflow-hidden cursor-pointer" onContextMenu={handleContextMenu}>
      {/* 卡片背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="space-y-1.5" onClick={handleRun}>
        {shortcut.icon && (
          <div className="text-4xl mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
            <i className={shortcut.icon}></i>
          </div>
        )}
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">{shortcut.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{shortcut.url}</p>
        {shortcut.args && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">参数: {shortcut.args}</p>
        )}
      </div>
      
      {/* 快捷方式操作按钮 */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
        <button
          className="p-2 text-xs text-gray-600 bg-white dark:text-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(shortcut)
          }}
          title="编辑"
        >
          <i className="ti ti-pencil"></i>
        </button>
        <button
          className="p-2 text-xs text-gray-600 bg-white dark:text-gray-300 dark:bg-gray-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200 shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          title="删除"
        >
          <i className="ti ti-trash"></i>
        </button>
      </div>
    </div>
  )
}

export default ShortcutCard