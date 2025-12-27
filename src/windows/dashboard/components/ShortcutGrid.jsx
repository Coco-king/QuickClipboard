import React, { useMemo, useState } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/dashboardStore.js'
import Button from '@shared/components/ui/Button.jsx'
import ShortcutCard from './ShortcutCard.jsx'
import ShortcutEdit from './ShortcutEdit.jsx'
import { useSortableList } from '@shared/hooks/useSortable'
import { closestCenter } from '@dnd-kit/core'
import { rectSortingStrategy } from '@dnd-kit/sortable'

const ShortcutGrid = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [showShortcutModal, setShowShortcutModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editingShortcut, setEditingShortcut] = useState(null)

  // 排序
  const sort = async (sortType) => {
    await dashboardStore.sortShortcuts(snapshot.selectedGroupId, sortType)
  }

  // 为快捷方式添加排序ID
  const shortcutsWithSortId = useMemo(() => {
    return snapshot.selectedGroup?.shortcuts.map(shortcut => ({
      ...shortcut,
      _sortId: shortcut.id
    })) || []
  }, [snapshot.selectedGroup?.shortcuts])

  // 处理快捷方式拖拽结束
  const handleShortcutDragEnd = async (oldIndex, newIndex) => {
    if (oldIndex === newIndex) {
      return
    }

    const shortcuts = shortcutsWithSortId || []

    const draggedShortcut = shortcuts[oldIndex]
    if (!draggedShortcut) {
      return
    }

    // 确定目标分组
    const targetGroupId = dragPreview?.targetGroupId || snapshot.selectedGroupId

    // 如果是跨分组拖拽，直接添加到目标分组的末尾
    const insertIndex = (targetGroupId === snapshot.selectedGroupId) ? (dragPreview?.insertIndex ?? newIndex) : null // 跨分组拖拽使用默认插入位置

    // 调用 store 的移动方法
    await dashboardStore.moveShortcut(
      draggedShortcut.id,
      snapshot.selectedGroupId,
      targetGroupId,
      insertIndex
    )

    // 清理拖拽状态
    setDragOverId(null)
    setDragPreview(null)
  }

  // 使用可排序列表钩子
  const {
    DndContext,
    SortableContext,
    DragOverlay,
    sensors,
    handleDragStart,
    handleDragEnd: onDragEnd,
    activeItem
  } = useSortableList({
    items: shortcutsWithSortId,
    onDragEnd: handleShortcutDragEnd
  })

  // 处理拖拽悬停事件
  const handleDragOver = (event) => {
    const {active, over} = event

    if (!active || !over) {
      setDragOverId(null)
      setDragPreview(null)
      return
    }

    // 检查是否拖拽到了分组项
    const targetGroup = snapshot.groups.find(group => group.id === over.id)

    if (targetGroup) {
      // 拖拽到其他分组，设置跨分组拖拽预览
      if (targetGroup.id !== snapshot.selectedGroupId) {
        setDragPreview({
          targetGroupId: targetGroup.id,
          insertIndex: null // 跨分组拖拽不指定具体插入位置
        })
        setDragOverId(null)
      }
      return
    }

    // 处理同一分组内的拖拽排序
    if (active.id !== over.id) {
      const overIndex = shortcutsWithSortId.findIndex(item => item._sortId === over.id)

      if (overIndex !== -1) {
        setDragOverId(over.id)

        let insertIndex = overIndex
        setDragPreview({
          targetGroupId: snapshot.selectedGroupId,
          insertIndex
        })
      }
    } else {
      // 拖拽到相同项目，清除状态
      setDragOverId(null)
      setDragPreview(null)
    }
  }

  // 处理拖拽取消
  const handleCancelDrag = () => {
    setDragOverId(null)
    setDragPreview(null)
  }

  // 拖拽状态管理
  const [dragOverId, setDragOverId] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragCancel={handleCancelDrag}
    >
      {/*这里如果改成 shortcutsWithSortId.map(group => group._sortId) 会导致拖动动画消失*/}
      <SortableContext items={shortcutsWithSortId} strategy={rectSortingStrategy}>
        <div className="shortcut-grid-content">
          {/* 快捷方式网格 */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,auto))] gap-0 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 justify-items-start">
            {snapshot.selectedGroup?.shortcuts.length > 0 ? (
              <>
                {/* 跨分组拖拽提示 */}
                {dragPreview && dragPreview.targetGroupId && dragPreview.targetGroupId !== snapshot.selectedGroupId && (
                  <div className="col-span-full mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                      <i className="ti ti-arrow-right text-lg mr-2"></i>
                      <span className="text-sm font-medium">
                        拖拽到 "{snapshot.groups.find(g => g.id === dragPreview.targetGroupId)?.name}" 分组
                      </span>
                    </div>
                  </div>
                )}

                {snapshot.selectedGroup.shortcuts.map((shortcut) => {
                  return (
                    <div key={shortcut.id} className="relative">
                      <ShortcutCard
                        shortcut={shortcut}
                        onDelete={() => dashboardStore.deleteShortcut(snapshot.selectedGroupId, shortcut.id)}
                        onEdit={openEditModal}
                        onAdd={openAddModal}
                        sort={sort}
                      />
                    </div>
                  )
                })}
              </>
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
      </SortableContext>

      {/* 拖拽覆盖层 */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-50">
            <ShortcutCard
              shortcut={activeItem}
              onDelete={() => {
              }}
              onEdit={() => {
              }}
              onAdd={() => {
              }}
              sort={() => {
              }}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default ShortcutGrid