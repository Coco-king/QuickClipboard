import React, { useState } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/dashboardStore.js'
import Button from '@shared/components/ui/Button.jsx'
import ShortcutCard from './ShortcutCard.jsx'
import ShortcutEdit from './ShortcutEdit.jsx'

const ShortcutGrid = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [showShortcutModal, setShowShortcutModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editingShortcut, setEditingShortcut] = useState(null)

  // 打开添加模态框
  const openAddModal = () => {
    setModalMode('add')
    setShowShortcutModal(true)
  }

  // 打开编辑模态框
  const openEditModal = (shortcut) => {
    setModalMode('edit')
    setEditingShortcut(shortcut)
    setShowShortcutModal(true)
  }

  // 保存快捷方式
  const handleSaveShortcut = async (shortcutData) => {
    if (modalMode === 'add') {
      await dashboardStore.addShortcut(snapshot.selectedGroupId, {
        name: shortcutData.name,
        url: shortcutData.url,
        icon: shortcutData.icon,
        runAsAdmin: shortcutData.runAsAdmin,
        args: shortcutData.args
      })
    } else if (modalMode === 'edit' && editingShortcut) {
      await dashboardStore.editShortcut(snapshot.selectedGroupId, editingShortcut.id, {
        ...editingShortcut,
        ...shortcutData
      })
    }
    setShowShortcutModal(false)
    setEditingShortcut(null)
  }

  return (
    <div className="shortcut-grid-content">
      {/* 快捷方式网格 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,auto))] gap-0 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 justify-items-start">
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

      {/* 快捷方式模态框 */}
      <ShortcutEdit
        isVisible={showShortcutModal}
        mode={modalMode}
        shortcut={editingShortcut}
        onClose={() => {
          setShowShortcutModal(false)
          setEditingShortcut(null)
        }}
        onSave={handleSaveShortcut}
      />
    </div>
  )
}

export default ShortcutGrid