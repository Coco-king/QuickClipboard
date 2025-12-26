use clipboard_rs::{Clipboard, ClipboardContext};
use serde_json::Value;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use ::windows::core::PCWSTR;
use ::windows::Win32::UI::Shell::{ShellExecuteW, CSIDL_DESKTOPDIRECTORY, SHGetFolderPathW, IShellLinkW};
use ::windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

use ::windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, CLSCTX_INPROC_SERVER, IPersistFile, COINIT_APARTMENTTHREADED, CoCreateInstance};
// 直接定义 CLSID_SHELL_LINK 的GUID值，避免依赖可选特性
const CLSID_SHELL_LINK: ::windows::core::GUID = ::windows::core::GUID::from_values(
    0x00021401, 0x0000, 0x0000, [0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46]
);
use ::windows::core::HSTRING;

use std::path::Path;

#[tauri::command]
pub fn set_mouse_position(x: i32, y: i32) -> Result<(), String> {
    crate::utils::mouse::set_cursor_position(x, y)
}

// 检查 AI 翻译配置
#[tauri::command]
pub fn check_ai_translation_config() -> Result<Value, String> {
    use crate::services::get_settings;

    let settings = get_settings();
    let is_configured = !settings.ai_api_key.is_empty() && settings.ai_translation_enabled;

    Ok(serde_json::json!({
        "is_configured": is_configured,
        "enabled": settings.ai_translation_enabled,
        "api_key_set": !settings.ai_api_key.is_empty(),
    }))
}

// 启用 AI 翻译取消快捷键
#[tauri::command]
pub fn enable_ai_translation_cancel_shortcut() -> Result<(), String> {
    Ok(())
}

// 禁用 AI 翻译取消快捷键
#[tauri::command]
pub fn disable_ai_translation_cancel_shortcut() -> Result<(), String> {
    Ok(())
}

// 复制纯文本
#[tauri::command]
pub fn copy_text_to_clipboard(text: String) -> Result<(), String> {
    let ctx = ClipboardContext::new().map_err(|e| format!("创建剪贴板上下文失败: {}", e))?;
    ctx.set_text(text)
        .map_err(|e| format!("设置剪贴板文本失败: {}", e))
}

// 检查 Win+V 是否已在系统中被禁用
#[tauri::command]
pub fn check_win_v_hotkey_disabled() -> Result<bool, String> {
    Ok(crate::services::system::win_v_hotkey::is_win_v_hotkey_disabled())
}

// 禁用系统 Win+V 快捷键并重启资源管理器
#[tauri::command]
pub fn disable_win_v_hotkey_and_restart() -> Result<(), String> {
    crate::services::system::win_v_hotkey::disable_win_v_hotkey()
}

// 启用系统 Win+V 快捷键并重启资源管理器
#[tauri::command]
pub fn enable_win_v_hotkey_and_restart() -> Result<(), String> {
    crate::services::system::win_v_hotkey::enable_win_v_hotkey()
}

#[tauri::command]
pub fn prompt_disable_win_v_hotkey_if_needed(app: tauri::AppHandle) -> Result<bool, String> {
    if crate::services::system::win_v_hotkey::is_win_v_hotkey_disabled() {
        return Ok(true);
    }

    let settings = crate::services::get_settings();
    let is_zh = settings.language.starts_with("zh");

    let (message, error_prefix) = if is_zh {
        (
            "当前全局快捷键使用 Win+V，为避免与系统自带的 Win+V 剪贴板快捷键冲突，需要在系统中禁用 Win+V 并重启资源管理器。\n\n是否现在修改注册表并重启资源管理器？",
            "禁用系统 Win+V 快捷键失败：",
        )
    } else {
        (
            "Your global shortcut is set to Win+V. To avoid conflicts with the Windows built-in Win+V clipboard history, the system Win+V shortcut must be disabled and Explorer must be restarted.\n\nDisable the system Win+V shortcut and restart Explorer now?",
            "Failed to disable system Win+V shortcut: ",
        )
    };

    let should_disable = app
        .dialog()
        .message(message)
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show();

    if !should_disable {
        return Ok(false);
    }

    if let Err(e) = crate::services::system::win_v_hotkey::disable_win_v_hotkey() {
        let _ = app
            .dialog()
            .message(format!("{}{}", error_prefix, e))
            .buttons(MessageDialogButtons::Ok)
            .blocking_show();
        return Ok(false);
    }

    Ok(true)
}

#[tauri::command]
pub fn prompt_enable_win_v_hotkey(app: tauri::AppHandle) -> Result<bool, String> {
    let settings = crate::services::get_settings();
    let is_zh = settings.language.starts_with("zh");

    let (message, error_prefix) = if is_zh {
        (
            "恢复系统 Win+V 快捷键会还原 Windows 自带的剪贴板历史快捷键（Win+V），并重启资源管理器。\n\n是否现在恢复？",
            "恢复系统 Win+V 快捷键失败：",
        )
    } else {
        (
            "Restoring the system Win+V shortcut will bring back the Windows built-in clipboard history (Win+V) and restart Explorer.\n\nRestore now?",
            "Failed to restore system Win+V shortcut: ",
        )
    };

    let should_enable = app
        .dialog()
        .message(message)
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show();

    if !should_enable {
        return Ok(false);
    }

    if let Err(e) = crate::services::system::win_v_hotkey::enable_win_v_hotkey() {
        let _ = app
            .dialog()
            .message(format!("{}{}", error_prefix, e))
            .buttons(MessageDialogButtons::Ok)
            .blocking_show();
        return Ok(false);
    }

    Ok(true)
}

// 进入低占用模式
#[tauri::command]
pub fn enter_low_memory_mode(app: tauri::AppHandle) -> Result<(), String> {
    crate::services::low_memory::enter_low_memory_mode(&app)
}

// 退出低占用模式
#[tauri::command]
pub fn exit_low_memory_mode(app: tauri::AppHandle) -> Result<(), String> {
    crate::services::low_memory::exit_low_memory_mode(&app)
}

// 检查是否处于低占用模式
#[tauri::command]
pub fn is_low_memory_mode() -> bool {
    crate::services::low_memory::is_low_memory_mode()
}

// 内部辅助函数：执行ShellExecuteW命令
fn execute_shell_command(operation: &str, program: &str, args: &[String]) -> Result<bool, String> {
    let operation: Vec<u16> = OsStr::new(operation)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let file: Vec<u16> = OsStr::new(program)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    // 构建命令行参数
    let args_str: String = args.join(" ");
    let parameters: Vec<u16> = OsStr::new(&args_str)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let result = ShellExecuteW(
            None,
            PCWSTR(operation.as_ptr()),
            PCWSTR(file.as_ptr()),
            PCWSTR(parameters.as_ptr()),
            PCWSTR(std::ptr::null()),
            SW_SHOWNORMAL,
        );

        // ShellExecuteW返回值大于32表示成功
        Ok(result.0 as usize > 32)
    }
}

// 运行程序（普通模式）
#[tauri::command]
pub fn run_program(program: String, args: Vec<String>) -> Result<bool, String> {
    execute_shell_command("open", &program, &args)
}

// 显示"打开方式"对话框
#[tauri::command]
pub fn show_open_with_dialog(path: String) -> Result<bool, String> {
    let operation: Vec<u16> = OsStr::new("open")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let dll_path: Vec<u16> = OsStr::new("rundll32.exe")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    // 使用rundll32.exe shell32.dll,OpenAs_RunDLL <file_path>来显示打开方式对话框
    let args_str = format!("shell32.dll,OpenAs_RunDLL {}", path);
    let parameters: Vec<u16> = OsStr::new(&args_str)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let result = ShellExecuteW(
            None,
            PCWSTR(operation.as_ptr()),
            PCWSTR(dll_path.as_ptr()),
            PCWSTR(parameters.as_ptr()),
            PCWSTR(std::ptr::null()),
            SW_SHOWNORMAL,
        );

        // ShellExecuteW返回值大于32表示成功
        Ok(result.0 as usize > 32)
    }
}

// 以管理员身份运行程序
#[tauri::command]
pub fn run_as_admin(program: String, args: Vec<String>) -> Result<bool, String> {
    execute_shell_command("runas", &program, &args)
}

// 创建桌面快捷方式
#[tauri::command]
pub fn create_desktop_shortcut(target_path: String, name: String, icon_path: String) -> Result<(), String> {
    unsafe {
        // 初始化COM
        let result = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        if result.is_err() {
            return Err("Failed to initialize COM".to_string());
        }
        
        // 获取桌面目录
        let mut desktop_path = [0u16; 260];
        let result = SHGetFolderPathW(
            None, // 使用None表示空窗口句柄
            CSIDL_DESKTOPDIRECTORY as i32, // 转换为正确的类型
            None,
            0,
            &mut desktop_path, // 使用数组引用而不是指针
        );
        if result.is_err() {
            CoUninitialize();
            return Err("Failed to get desktop path".to_string());
        }
        
        // 构建快捷方式文件路径
        let shortcut_path = format!("{}\\{}.lnk", 
            String::from_utf16_lossy(&desktop_path).trim_end_matches(char::from(0)), 
            name
        );
        
        // 创建ShellLink对象
        let shell_link: Result<IShellLinkW, windows::core::Error> = unsafe {
            CoCreateInstance(&CLSID_SHELL_LINK, None, CLSCTX_INPROC_SERVER)
        };
        if shell_link.is_err() {
            CoUninitialize();
            return Err("Failed to create shell link".to_string());
        }
        let mut shell_link = shell_link.unwrap();
        
        // 设置目标路径
        let target_path_wide: Vec<u16> = OsStr::new(&target_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let result = shell_link.SetPath(PCWSTR(target_path_wide.as_ptr()));
        if result.is_err() {
            CoUninitialize();
            return Err("Failed to set target path".to_string());
        }
        
        // 设置图标（如果提供）
        if !icon_path.is_empty() && Path::new(&icon_path).exists() {
            let icon_path_wide: Vec<u16> = OsStr::new(&icon_path)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();
            let result = shell_link.SetIconLocation(PCWSTR(icon_path_wide.as_ptr()), 0);
            if result.is_err() {
                CoUninitialize();
                return Err("Failed to set icon location".to_string());
            }
        }
        
        // 获取IPersistFile接口
        let persist_file: Result<IPersistFile, windows::core::Error> = unsafe {
            ::windows::core::Interface::cast(&shell_link)
        };
        if persist_file.is_err() {
            CoUninitialize();
            return Err("Failed to get IPersistFile interface".to_string());
        }
        let mut persist_file = persist_file.unwrap();
        
        let shortcut_path_hstring = HSTRING::from(&shortcut_path);
        let result = persist_file.Save(PCWSTR(shortcut_path_hstring.as_ptr()), true);
        if result.is_err() {
            CoUninitialize();
            return Err("Failed to save shortcut".to_string());
        }
        
        // 释放资源
        CoUninitialize();
        
        Ok(())
    }
}