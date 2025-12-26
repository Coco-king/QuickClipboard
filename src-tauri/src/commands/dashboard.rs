use crate::services::database::dashboard::{dashboard_add_group, dashboard_add_shortcut, dashboard_delete_group, dashboard_delete_shortcut, dashboard_get_all_groups, dashboard_get_dashboard_data, dashboard_get_shortcuts_by_group, dashboard_reorder_groups, dashboard_reorder_shortcuts, dashboard_update_group, dashboard_update_shortcut};
use crate::utils::icon::get_file_icon_base64;
use crate::services::database::{DashboardGroup, DashboardShortcut};

// 获取所有启动板分组
#[tauri::command]
pub fn get_dashboard_groups() -> Result<Vec<DashboardGroup>, String> {
    dashboard_get_all_groups()
}

// 添加启动板分组
#[tauri::command]
pub fn add_dashboard_group(id: String, name: String, icon: Option<String>) -> Result<DashboardGroup, String> {
    dashboard_add_group(id, name, icon)
}

// 更新启动板分组
#[tauri::command]
pub fn update_dashboard_group(id: String, name: String, icon: Option<String>) -> Result<DashboardGroup, String> {
    dashboard_update_group(id, name, icon)
}

// 删除启动板分组
#[tauri::command]
pub fn delete_dashboard_group(id: String) -> Result<(), String> {
    dashboard_delete_group(id)
}

// 重新排序启动板分组
#[tauri::command]
pub fn reorder_dashboard_groups(groups: Vec<(String, i32)>) -> Result<(), String> {
    dashboard_reorder_groups(groups)
}

// 根据分组ID获取快捷方式
#[tauri::command]
pub fn get_dashboard_shortcuts(group_id: String) -> Result<Vec<DashboardShortcut>, String> {
    dashboard_get_shortcuts_by_group(group_id)
}

// 添加快捷方式
#[tauri::command]
pub fn add_dashboard_shortcut(id: String, group_id: String, name: String, icon: Option<String>, url: String, run_as_admin: Option<bool>, args: Option<String>) -> Result<DashboardShortcut, String> {
    dashboard_add_shortcut(id, group_id, name, icon, url, run_as_admin, args)
}

// 更新快捷方式
#[tauri::command]
pub fn update_dashboard_shortcut(id: String, name: String, icon: Option<String>, url: String, run_as_admin: Option<bool>, args: Option<String>) -> Result<DashboardShortcut, String> {
    dashboard_update_shortcut(id, name, icon, url, run_as_admin, args)
}

// 删除快捷方式
#[tauri::command]
pub fn delete_dashboard_shortcut(id: String) -> Result<(), String> {
    dashboard_delete_shortcut(id)
}

// 重新排序快捷方式
#[tauri::command]
pub fn reorder_dashboard_shortcuts(group_id: String, shortcuts: Vec<(String, i32)>) -> Result<(), String> {
    dashboard_reorder_shortcuts(group_id, shortcuts)
}

// 获取完整的启动板数据
#[tauri::command]
pub fn get_dashboard_data() -> Result<Vec<(DashboardGroup, Vec<DashboardShortcut>)>, String> {
    dashboard_get_dashboard_data()
}

// 获取应用程序图标
#[tauri::command]
pub fn get_app_icon(path: String, size: u32) -> Result<Option<String>, String> {
    Ok(get_file_icon_base64(&path, size))
}