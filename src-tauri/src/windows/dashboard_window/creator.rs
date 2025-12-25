use tauri::AppHandle;

// 创建启动板窗口
pub fn create_dashboard_window(app: &AppHandle, visible: bool) -> Result<(), String> {
    let height = 700.0;
    let min_height = 400.0;
    let x = 1.6180339887;

    let _dashboard_window = tauri::WebviewWindowBuilder::new(
        app,
        "dashboard",
        tauri::WebviewUrl::App("windows/dashboard/index.html".into()),
    )
        .title("启动板 - 快速剪贴板")
        .inner_size(height * x, height)
        .min_inner_size(min_height * x, min_height)
        .center()
        .resizable(true)
        .maximizable(false)
        .decorations(false)
        .transparent(true)
        .skip_taskbar(false)
        .visible(visible)
        .focused(visible)
        .build()
        .map_err(|e| format!("创建启动板窗口失败: {}", e))?;

    Ok(())
}
