use super::creator::create_dashboard_window;
use tauri::{AppHandle, Manager};

pub fn open_dashboard_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("dashboard") {
        if window.is_minimized().unwrap_or(false) {
            window.unminimize().map_err(|e| format!("取消最小化启动板窗口失败: {}", e))?;
        }
        window.show().map_err(|e| format!("显示启动板窗口失败: {}", e))?;
        window.set_focus().map_err(|e| format!("聚焦启动板窗口失败: {}", e))?;
    } else {
        create_dashboard_window(app, true)?;
        if let Some(window) = app.get_webview_window("dashboard") {
            window.set_focus().map_err(|e| format!("聚焦启动板窗口失败: {}", e))?;
        }
    }

    Ok(())
}