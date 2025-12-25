import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

document.addEventListener('contextmenu', event => event.preventDefault());
// 显示右键菜单
export async function showContextMenu(options) {
    try {
      // 首选方案：直接使用屏幕坐标（如果可用）
      if (options.screenX && options.screenY && !isNaN(options.screenX) && !isNaN(options.screenY)) {
        const result = await invoke('show_context_menu', {
          items: options.items,
          x: Math.round(options.screenX),
          y: Math.round(options.screenY),
          width: options.width || null,
          theme: options.theme || null
        });
        return result;
      }

      // 备选方案：使用窗口坐标计算屏幕坐标
        const currentWindow = getCurrentWindow();

      // 获取窗口信息
        const outerPosition = await currentWindow.outerPosition();
        const outerSize = await currentWindow.outerSize();
        const innerSize = await currentWindow.innerSize();
        const scaleFactor = await currentWindow.scaleFactor();

      // 确保获取的窗口信息有效
      if (isNaN(outerPosition.x) || isNaN(outerPosition.y) ||
        isNaN(outerSize.width) || isNaN(outerSize.height) ||
        isNaN(innerSize.width) || isNaN(innerSize.height) ||
        isNaN(scaleFactor)) {
        console.error('无法获取完整的窗口信息');

        // 使用最后备选方案：直接使用客户端坐标
        const result = await invoke('show_context_menu', {
          items: options.items,
          x: Math.round(options.x),
          y: Math.round(options.y),
          width: options.width || null,
          theme: options.theme || null
        });
        return result;
      }

      // 计算窗口边框和标题栏的总高度
      const titleBarHeight = (outerSize.height - innerSize.height) / scaleFactor;

      // 转换物理坐标为逻辑坐标
        const logicalWindowX = outerPosition.x / scaleFactor;
        const logicalWindowY = outerPosition.y / scaleFactor;

      // 计算屏幕坐标
        const screenX = logicalWindowX + options.x;
        const screenY = logicalWindowY + titleBarHeight + options.y;

        const result = await invoke('show_context_menu', {
            items: options.items,
            x: Math.round(screenX),
            y: Math.round(screenY),
            width: options.width || null,
            theme: options.theme || null
        });

        return result;
    } catch (error) {
        console.error('显示右键菜单失败:', error);

      // 异常情况下的最后备选方案
      try {
        const result = await invoke('show_context_menu', {
          items: options.items,
          x: Math.round(options.x),
          y: Math.round(options.y),
          width: options.width || null,
          theme: options.theme || null
        });
        return result;
      } catch (fallbackError) {
        console.error('备选方案也失败了:', fallbackError);
        return null;
      }
    }
}

// 从鼠标事件显示右键菜单
export async function showContextMenuFromEvent(event, items, extraOptions = {}) {
    event.preventDefault();
    event.stopPropagation();

    return await showContextMenu({
        items,
        x: event.clientX,
        y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
        ...extraOptions
    });
}

// 创建菜单项
export function createMenuItem(id, label, options = {}) {
    return {
        id,
        label,
        icon: options.icon || null,
        favicon: options.favicon || null,
        icon_color: options.iconColor || null,
        disabled: options.disabled || false,
        children: options.children || null,
        separator: false
    };
}

// 创建分隔线
export function createSeparator() {
    return {
        separator: true,
        id: '',
        label: ''
    };
}

// 关闭所有右键菜单窗口
export async function closeAllContextMenus() {
    try {
        await invoke('close_all_context_menus');
    } catch (error) {
        console.error('关闭右键菜单失败:', error);
    }
}