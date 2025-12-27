import React, { useState, useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/index.js'
import { createMenuItem, createSeparator, showContextMenuFromEvent } from '@/plugins/context_menu/index.js'
import { useSortableList, useSortable, CSS } from '@shared/hooks/useSortable'
import { closestCenter } from '@dnd-kit/core'
import { verticalListSortingStrategy } from '@dnd-kit/sortable'

// 可拖动的分组项
function SortableGroupItem({ group, editingGroupId, editGroupName, setEditGroupName, handleSaveEdit, handleContextMenu, handleSelectGroup, selectedGroupId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: group.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.3 : 1
  };
  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        key={group.id}
        onClick={() => handleSelectGroup(group.id)}
        className={`group-item mb-2 rounded-lg p-2 cursor-pointer transition-all duration-200 flex justify-between items-center ${selectedGroupId === group.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        onContextMenu={(e) => handleContextMenu(e, group)}
      >
        {editingGroupId === group.id ? (
          <div className="flex-1">
            <input
              type="text"
              className="w-full py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              onBlur={(e) => handleSaveEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') setEditingGroupId(null)
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex-1">
            {group.name}
          </div>
        )}
      </div>
    </div>;
}

const GroupList = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editGroupName, setEditGroupName] = useState('')
  
  // 为分组项添加排序ID
  const groupsWithSortId = useMemo(() => {
    return snapshot.groups.map(group => ({
      ...group,
      _sortId: group.id
    }))
  }, [snapshot.groups]);
  
  // 处理分组拖动结束
  const handleDragEnd = async (oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    
    // 创建新的顺序数组
    const newOrder = [...snapshot.groups].map(group => group.id);
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);
    
    // 调用重新排序方法
    await dashboardStore.reorderGroups(newOrder);
  };
  
  // 使用可排序列表钩子
  const {
    DndContext,
    SortableContext,
    DragOverlay,
    sensors,
    handleDragStart,
    handleDragEnd: onDragEnd,
    handleDragCancel,
    activeId
  } = useSortableList({
    items: groupsWithSortId,
    onDragEnd: handleDragEnd
  });
  
  // 获取当前活动的分组项
  const activeGroup = useMemo(() => {
    return snapshot.groups.find(group => group.id === activeId);
  }, [activeId, snapshot.groups]);

  const handleSelectGroup = (groupId) => {
    dashboardStore.selectGroup(groupId)
  }

  const handleEditGroup = (group) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
  }

  const handleSaveEdit = async () => {
    if (editGroupName.trim()) {
      await dashboardStore.renameGroup(editingGroupId, editGroupName.trim())
      setEditingGroupId(null)
      setEditGroupName('')
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (confirm('确定要删除此分组吗？')) {
      await dashboardStore.deleteGroup(groupId)
    }
  }

  const handleContextMenu = async (event, group = null) => {
    event.preventDefault()
    event.stopPropagation()

    const menuItems = []

    // 添加新建分组选项（点击空白区域或分组都显示）
    menuItems.push(createMenuItem('new', '新建分组', {icon: 'ti ti-plus'}))

    // 如果点击的是分组，添加分隔线和其他选项
    if (group) {
      menuItems.push(createSeparator())
      menuItems.push(createMenuItem('edit', '重命名', {icon: 'ti ti-pencil'}))
      menuItems.push(createMenuItem('delete', '删除', {icon: 'ti ti-trash'}, {
        disabled: snapshot.groups.length <= 1
      }))
    }

    const result = await showContextMenuFromEvent(event, menuItems)
    if (!result) return

    switch (result) {
      case 'new':
        // 新建分组后立即编辑
        const newGroup = await dashboardStore.addGroup('新分组')
        if (newGroup) {
          handleEditGroup(newGroup)
        }
        break
      case 'edit':
        if (group) handleEditGroup(group)
        break
      case 'delete':
        if (group) handleDeleteGroup(group.id)
        break
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={groupsWithSortId.map(group => group._sortId)} strategy={verticalListSortingStrategy}>
        <div className="group-list-content flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(e)}>
          {snapshot.groups.map((group) => (
            <SortableGroupItem
              key={group.id}
              group={group}
              editingGroupId={editingGroupId}
              editGroupName={editGroupName}
              setEditGroupName={setEditGroupName}
              handleSaveEdit={handleSaveEdit}
              handleContextMenu={handleContextMenu}
              handleSelectGroup={handleSelectGroup}
              selectedGroupId={snapshot.selectedGroupId}
            />
          ))}
        </div>
      </SortableContext>
      
      {/* 拖动覆盖层 */}
      <DragOverlay>
        {activeGroup && (
          <div className="group-item mb-2 rounded-lg p-2 cursor-grabbing bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium shadow-lg">
            <div className="flex-1">
              {activeGroup.name}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default GroupList