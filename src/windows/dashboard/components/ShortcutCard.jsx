import React from 'react'
import { createMenuItem, createSeparator, showContextMenuFromEvent } from '@/plugins/context_menu/index.js'

const ShortcutCard = ({shortcut, onDelete, onEdit}) => {
  const handleDelete = () => {
    onDelete(shortcut.id)
  }

  // 处理快捷方式运行
  const handleRun = async () => {
    try {
      const {shell} = await import('@tauri-apps/api')
      const command = shortcut.url
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
      const command = shortcut.url

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
      const command = shortcut.url
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
    <div className="w-full">
      <div className="w-26 h-26 relative border-1 border-transparent hover:border-gray-400 rounded-s p-2 transition-all duration-250 overflow-hidden cursor-pointer flex flex-col items-center" onContextMenu={handleContextMenu} onClick={handleRun}>
        {/* 图标部分 */}
        <div className="w-12 h-12">
          {shortcut.icon.startsWith("ti") ? (<i className={`${shortcut.icon} text-5xl`}></i>) : (<img src={shortcut.icon} alt="图标" className="w-full h-full object-contain"/>)}
        </div>
        <p className="mt-1 w-full h-10 flex justify-center text-center overflow-hidden text-[0.8rem] text-gray-800 dark:text-gray-200 break-all">{shortcut.name}</p>
      </div>
    </div>
  )
}

export default ShortcutCard