import React, { useState } from 'react'
import { useSnapshot } from 'valtio'
import { dashboardStore } from '@shared/store/index.js'
import GroupList from '@windows/dashboard/components/GroupList.jsx'
import ShortcutGrid from '@windows/dashboard/components/ShortcutGrid.jsx'
import Button from '@shared/components/ui/Button.jsx'

const Dashboard = () => {
  const snapshot = useSnapshot(dashboardStore)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      await dashboardStore.addGroup(newGroupName.trim())
      setNewGroupName('')
      setShowAddGroupModal(false)
    }
  }

  return (
    <div className="dashboard flex h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative">
      {/* 分组列表 */}
      <div className="group-list w-38 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col">
        <GroupList/>
      </div>

      {/* 快捷方式网格 */}
      <div className="shortcut-grid flex-1 overflow-y-auto">
        <ShortcutGrid/>
      </div>

      {/* 添加分组模态框 */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">新建分组</h3>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              placeholder="分组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowAddGroupModal(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
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

export default Dashboard