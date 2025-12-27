import React from 'react'
import { createMenuItem, createSeparator, showContextMenuFromEvent } from '@/plugins/context_menu/index.js'
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener'
import { invoke } from '@tauri-apps/api/core'
import { CSS, useSortable } from '@shared/hooks/useSortable'

const ShortcutCard = ({shortcut, onDelete, onEdit, onAdd, sort}) => {
  // 使用 sortable hook 让卡片可拖拽
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: shortcut._sortId || shortcut.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.3 : 1
  };

  const handleDelete = () => {
    onDelete(shortcut.id)
  }

  const copyFullPath = async () => {
    try {
      await navigator.clipboard.writeText(shortcut.url);
    } catch (error) {
      console.error('复制路径失败:', error);
    }
  }

  // 打开方式
  const openWay = async () => {
    try {
      // 使用系统默认的"打开方式"对话框
      await invoke('show_open_with_dialog', {
        path: shortcut.url
      });
    } catch (error) {
      console.error('打开方式失败:', error);
    }
  }

  // 资源管理器菜单
  const explorerContextMenu = async () => {

  }

  // 创建桌面快捷方式
  const createDesktopShortcut = async () => {
    try {
      await invoke('create_desktop_shortcut', {
        targetPath: shortcut.url,
        name: shortcut.name,
        iconPath: shortcut.icon
      });
    } catch (error) {
      console.error('创建桌面快捷方式失败:', error);
    }
  }

  // 处理快捷方式运行
  const handleRun = async () => {
    try {
      const command = shortcut.url
      const args = shortcut.args ? shortcut.args.split(' ') : []

      // 验证命令和参数
      if (!command) {
        return
      }

      // 如果是URL，使用openUrl
      if (command.startsWith('http://') || command.startsWith('https://')) {
        await openUrl(command)
      } else {
        // 对于文件路径或程序，使用run_program命令以支持参数
        await invoke('run_program', {
          program: command,
          args: args
        })
      }
    } catch (error) {
      console.error('运行快捷方式失败:', error)
    }
  }

  // 打开文件所在位置
  const openFileLocation = async () => {
    try {
      const command = shortcut.url
      if (!command) return
      await revealItemInDir(command)
    } catch (error) {
      console.error('打开文件所在位置失败:', error)
    }
  }

  // 以管理员身份运行
  const runAsAdministrator = async () => {
    try {
      const command = shortcut.url;
      if (!command) return;

      const args = shortcut.args ? shortcut.args.split(' ') : [];

      // 调用Rust实现的run_as_admin命令
      const success = await invoke('run_as_admin', {
        program: command,
        args: args
      });

      if (!success) {
        console.error('以管理员身份运行失败: ShellExecuteW返回错误');
      }
    } catch (error) {
      alert(error)
      console.error('以管理员身份运行失败:', error);
    }
  }

  // 处理右键菜单
  const handleContextMenu = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const menuItems = [
      createMenuItem('runAsAdmin', '管理员身份运行', {icon: 'ti ti-shield'}),
      createMenuItem('openWay', '打开方式', {icon: 'ti ti-list-search'}),
      createMenuItem('openLocation', '打开文件所在位置', {icon: 'ti ti-folder-open'}),
      // createMenuItem('explorerContextMenu', '资源管理器菜单', {icon: 'ti ti-menu'}),
      createMenuItem('copyFullPath', '复制完整路径', {icon: 'ti ti-copy'}),
      createMenuItem('createDesktopShortcut', '创建桌面快捷方式', {icon: 'ti ti-link'}),
      createSeparator(),
      createMenuItem('create', '新建项目', {icon: 'ti ti-plus'}),
      createMenuItem('sortAsName', '按名称排序', {icon: 'ti ti-sort-a-z'}),
      createMenuItem('edit', '编辑', {icon: 'ti ti-pencil'}),
      createMenuItem('delete', '删除', {icon: 'ti ti-trash'}),
    ]

    const result = await showContextMenuFromEvent(event, menuItems)
    if (!result) return

    switch (result) {
      case 'runAsAdmin':
        await runAsAdministrator()
        break
      case 'openWay':
        await openWay()
        break
      case 'openLocation':
        await openFileLocation()
        break
      case 'explorerContextMenu':
        await explorerContextMenu()
        break
      case 'copyFullPath':
        await copyFullPath()
        break
      case 'createDesktopShortcut':
        await createDesktopShortcut()
        break
      case 'create':
        // 通知父组件打开新建对话框
        onAdd();
        break
      case 'sortAsName':
        // 使用特定参数表示按名称排序
        sort('name');
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
    <div className="w-full" ref={setNodeRef} style={style} {...attributes}>
      <div className="w-26 h-26 relative border-1 border-transparent hover:border-gray-400 rounded-s p-2 transition-all duration-250 overflow-hidden cursor-pointer flex flex-col items-center" onContextMenu={handleContextMenu} onClick={handleRun} {...listeners}>
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