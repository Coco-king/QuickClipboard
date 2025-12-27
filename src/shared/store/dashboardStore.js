import { proxy } from 'valtio'
import { invoke } from '@tauri-apps/api/core'

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function handlerSortShortcuts(shortcuts, sortType) {
  if (!shortcuts) {
    return
  }

  shortcuts.sort((a, b) => {
    if (sortType === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortType === 'createdAt') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else if (sortType === 'updatedAt') {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    }
    return 0
  })

  // 重新排序新分组的快捷方式
  return shortcuts.map((s, index) => [s.id, index])
}

// 启动板 Store
export const dashboardStore = proxy({
  // 分组列表
  groups: [],

  // UI设置
  showSearch: false,
  selectedGroupId: '',

  // 获取当前选中的分组
  get selectedGroup() {
    return this.groups.find(group => group.id === this.selectedGroupId) || this.groups[0]
  },

  // 从SQLite加载数据
  async loadData() {
    try {
      const dashboardData = await invoke('get_dashboard_data')

      if (dashboardData && Array.isArray(dashboardData)) {
        // 转换数据格式以匹配前端期望的结构
        this.groups = dashboardData.map(([group, shortcuts]) => ({
          id: group.id,
          name: group.name,
          icon: group.icon,
          shortcuts: shortcuts.map(shortcut => ({
            id: shortcut.id,
            name: shortcut.name,
            icon: shortcut.icon,
            url: shortcut.url,
            runAsAdmin: shortcut.run_as_admin || false,
            args: shortcut.args || '',
            createdAt: shortcut.created_at,
            updatedAt: shortcut.updated_at
          }))
        }))

        // 如果有分组，选择第一个分组
        if (this.groups.length > 0) {
          this.selectedGroupId = this.groups[0].id
        }
      } else {
        // 如果没有数据，创建一个默认分组
        await this.addGroup('新分组')
      }
    } catch (error) {
      console.error('加载启动板数据失败:', error)
      // 如果加载失败，尝试创建默认分组
      await this.addGroup('新分组')
    }
  },

  // 添加分组
  async addGroup(name) {
    const groupId = generateId()
    try {
      const newGroup = await invoke('add_dashboard_group', {
        id: groupId,
        name,
        icon: null
      })

      // 添加到本地状态
      this.groups.push({
        id: newGroup.id,
        name: newGroup.name,
        icon: newGroup.icon,
        shortcuts: []
      })

      // 如果是第一个分组，自动选择
      if (this.groups.length === 1) {
        this.selectedGroupId = newGroup.id
      }

      return newGroup
    } catch (error) {
      console.error('添加分组失败:', error)
      return null
    }
  },

  // 删除分组
  async deleteGroup(groupId) {
    if (this.groups.length <= 1) return false

    try {
      await invoke('delete_dashboard_group', {
        id: groupId
      })

      // 更新本地状态
      const index = this.groups.findIndex(group => group.id === groupId)
      if (index !== -1) {
        this.groups.splice(index, 1)

        // 如果删除的是当前选中的分组，切换到第一个分组
        if (this.selectedGroupId === groupId) {
          this.selectedGroupId = this.groups[0].id
        }
      }

      return true
    } catch (error) {
      console.error('删除分组失败:', error)
      return false
    }
  },

  // 重命名分组
  async renameGroup(groupId, newName) {
    try {
      await invoke('update_dashboard_group', {
        id: groupId,
        name: newName,
        icon: null
      })

      // 更新本地状态
      const group = this.groups.find(group => group.id === groupId)
      if (group) {
        group.name = newName
      }

      return true
    } catch (error) {
      console.error('重命名分组失败:', error)
      return false
    }
  },

  // 选择分组
  selectGroup(groupId) {
    this.selectedGroupId = groupId
    return true
  },

  async sortShortcuts(selectedGroupId, sortType) {
    // 对快捷方式进行排序
    const group = this.groups.find(group => group.id === selectedGroupId)
    if (group) {
      const shortcutsForReorder = handlerSortShortcuts(group.shortcuts, sortType);
      if (shortcutsForReorder) {
        // 排序之后保存到数据库
        await invoke('reorder_dashboard_shortcuts', {
          groupId: selectedGroupId,
          shortcuts: shortcutsForReorder
        })
      }
    }
  },

  // 添加快捷方式
  async addShortcut(groupId, shortcut) {
    const shortcutId = generateId()
    try {
      const newShortcut = await invoke('add_dashboard_shortcut', {
        id: shortcutId,
        groupId,
        name: shortcut.name,
        icon: shortcut.icon || null,
        url: shortcut.url,
        runAsAdmin: shortcut.runAsAdmin || false,
        args: shortcut.args || ''
      })

      // 更新本地状态
      const group = this.groups.find(group => group.id === groupId)
      if (group) {
        group.shortcuts.push({
          id: newShortcut.id,
          name: newShortcut.name,
          icon: newShortcut.icon,
          url: newShortcut.url,
          runAsAdmin: newShortcut.run_as_admin || false,
          args: newShortcut.args || '',
          createdAt: newShortcut.created_at,
          updatedAt: newShortcut.updated_at
        })
      }

      return newShortcut
    } catch (error) {
      console.error('添加快捷方式失败:', error)
      return null
    }
  },

  // 删除快捷方式
  async deleteShortcut(groupId, shortcutId) {
    try {
      await invoke('delete_dashboard_shortcut', {
        id: shortcutId
      })

      // 更新本地状态
      const group = this.groups.find(group => group.id === groupId)
      if (group) {
        const index = group.shortcuts.findIndex(shortcut => shortcut.id === shortcutId)
        if (index !== -1) {
          group.shortcuts.splice(index, 1)
        }
      }

      return true
    } catch (error) {
      console.error('删除快捷方式失败:', error)
      return false
    }
  },

  // 编辑快捷方式
  async editShortcut(groupId, shortcutId, newData) {
    try {
      const updatedShortcut = await invoke('update_dashboard_shortcut', {
        id: shortcutId,
        name: newData.name,
        icon: newData.icon || null,
        url: newData.url,
        runAsAdmin: newData.runAsAdmin || false,
        args: newData.args || ''
      })

      // 更新本地状态
      const group = this.groups.find(group => group.id === groupId)
      if (group) {
        const shortcut = group.shortcuts.find(shortcut => shortcut.id === shortcutId)
        if (shortcut) {
          shortcut.name = newData.name
          shortcut.icon = newData.icon
          shortcut.url = newData.url
          shortcut.runAsAdmin = newData.runAsAdmin || false
          shortcut.args = newData.args || ''
          shortcut.updatedAt = updatedShortcut.updated_at
        }
      }

      return true
    } catch (error) {
      console.error('编辑快捷方式失败:', error)
      return false
    }
  },

  // 移动快捷方式
  async moveShortcut(shortcutId, fromGroupId, toGroupId, insertIndex = null) {
    try {
      if (fromGroupId === toGroupId) {
        // 同一分组内移动
        const group = this.groups.find(group => group.id === fromGroupId)
        if (!group) return false

        // 获取当前顺序
        const shortcutIndex = group.shortcuts.findIndex(shortcut => shortcut.id === shortcutId)
        if (shortcutIndex === -1) return false

        // 执行内存中的移动
        const shortcut = group.shortcuts.splice(shortcutIndex, 1)[0]
        const targetIndex = insertIndex !== null ? insertIndex : group.shortcuts.length
        group.shortcuts.splice(targetIndex, 0, shortcut)

        // 准备重新排序的数据
        const shortcutsForReorder = group.shortcuts.map((shortcut, index) => [shortcut.id, index])

        // 调用重新排序API
        await invoke('reorder_dashboard_shortcuts', {
          groupId: fromGroupId,
          shortcuts: shortcutsForReorder
        })
      } else {
        // 跨分组移动
        const fromGroup = this.groups.find(group => group.id === fromGroupId)
        const toGroup = this.groups.find(group => group.id === toGroupId)

        if (!fromGroup || !toGroup) return false

        // 获取要移动的快捷方式
        const shortcutIndex = fromGroup.shortcuts.findIndex(shortcut => shortcut.id === shortcutId)
        if (shortcutIndex === -1) return false

        const shortcut = fromGroup.shortcuts[shortcutIndex]

        // 从原分组删除
        await invoke('delete_dashboard_shortcut', {
          id: shortcutId
        })

        // 添加到新分组
        await invoke('add_dashboard_shortcut', {
          id: shortcutId,
          groupId: toGroupId,
          name: shortcut.name,
          icon: shortcut.icon || null,
          url: shortcut.url,
          runAsAdmin: shortcut.runAsAdmin || false,
          args: shortcut.args || ''
        })

        // 更新本地状态
        fromGroup.shortcuts.splice(shortcutIndex, 1)
        const targetIndex = insertIndex !== null ? insertIndex : toGroup.shortcuts.length
        toGroup.shortcuts.splice(targetIndex, 0, shortcut)

        // 重新排序新分组的快捷方式
        const shortcutsForReorder = toGroup.shortcuts.map((s, index) => [s.id, index])

        await invoke('reorder_dashboard_shortcuts', {
          groupId: toGroupId,
          shortcuts: shortcutsForReorder
        })
      }

      return true
    } catch (error) {
      console.error('移动快捷方式失败:', error)
      return false
    }
  },

  // 切换搜索框显示状态
  toggleSearch() {
    this.showSearch = !this.showSearch
  },

  // 关闭搜索框
  closeSearch() {
    this.showSearch = false
  },

  // 重新排序分组
  async reorderGroups(newOrder) {
    try {
      // 更新本地状态
      const reorderedGroups = newOrder.map(id => this.groups.find(group => group.id === id));
      this.groups = reorderedGroups;

      // 转换为后端期望的格式：Vec<(String, i32)>
      const groupsForReorder = newOrder.map((id, index) => [id, index]);

      // 调用后端API保存新顺序
      await invoke('reorder_dashboard_groups', {
        groups: groupsForReorder
      });

      return true;
    } catch (error) {
      console.error('重新排序分组失败:', error);
      return false;
    }
  }
})

// 初始化启动板数据
export async function initDashboard() {
  await dashboardStore.loadData()
}