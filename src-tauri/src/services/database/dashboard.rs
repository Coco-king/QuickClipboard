use super::connection::with_connection;
use super::models::{DashboardGroup, DashboardShortcut};
use chrono;
use rusqlite::params;

// 获取所有启动板分组
pub fn dashboard_get_all_groups() -> Result<Vec<DashboardGroup>, String> {
    with_connection(|conn| {
        let mut stmt = conn.prepare("SELECT id, name, icon, order_index, created_at, updated_at FROM dashboard_groups ORDER BY order_index, created_at")?;
        let groups = stmt
            .query_map([], |row| {
                Ok(DashboardGroup {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    icon: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(groups)
    })
}

// 添加启动板分组
pub fn dashboard_add_group(id: String, name: String, icon: Option<String>) -> Result<DashboardGroup, String> {
    with_connection(|conn| {
        let now = chrono::Local::now().timestamp();
        let max_order: Option<i32> = conn.query_row(
            "SELECT MAX(order_index) FROM dashboard_groups",
            [],
            |row| row.get(0)
        ).ok().flatten();
        let order_index = max_order.unwrap_or(-1) + 1;

        conn.execute(
            "INSERT INTO dashboard_groups (id, name, icon, order_index, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![&id, &name, &icon, order_index, now, now],
        )?;

        Ok(DashboardGroup {
            id,
            name,
            icon,
            order_index,
            created_at: now,
            updated_at: now,
        })
    })
}

// 更新启动板分组
pub fn dashboard_update_group(id: String, name: String, icon: Option<String>) -> Result<DashboardGroup, String> {
    with_connection(|conn| {
        let now = chrono::Local::now().timestamp();
        conn.execute(
            "UPDATE dashboard_groups SET name = ?1, icon = ?2, updated_at = ?3 WHERE id = ?4",
            params![&name, &icon, now, &id],
        )?;

        let group = conn.query_row(
            "SELECT id, name, icon, order_index, created_at, updated_at FROM dashboard_groups WHERE id = ?1",
            params![&id],
            |row| {
                Ok(DashboardGroup {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    icon: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            }
        )?;

        Ok(group)
    })
}

// 删除启动板分组
pub fn dashboard_delete_group(id: String) -> Result<(), String> {
    with_connection(|conn| {
        conn.execute(
            "DELETE FROM dashboard_groups WHERE id = ?1",
            params![&id],
        )?;
        Ok(())
    })
}

// 重新排序启动板分组
pub fn dashboard_reorder_groups(groups: Vec<(String, i32)>) -> Result<(), String> {
    with_connection(|conn| {
        let tx = conn.unchecked_transaction()?;
        for (id, order_index) in groups {
            tx.execute(
                "UPDATE dashboard_groups SET order_index = ?1, updated_at = ?2 WHERE id = ?3",
                params![order_index, chrono::Local::now().timestamp(), &id],
            )?;
        }
        tx.commit()?;
        Ok(())
    })
}

// 根据分组ID获取快捷方式
pub fn dashboard_get_shortcuts_by_group(group_id: String) -> Result<Vec<DashboardShortcut>, String> {
    with_connection(|conn| {
        let mut stmt = conn.prepare("SELECT id, group_id, name, icon, url, run_as_admin, args, order_index, created_at, updated_at FROM dashboard_shortcuts WHERE group_id = ?1 ORDER BY order_index, created_at")?;
        let shortcuts = stmt
            .query_map(params![&group_id], |row| {
                Ok(DashboardShortcut {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    name: row.get(2)?,
                    icon: row.get(3)?,
                    url: row.get(4)?,
                    run_as_admin: row.get(5)?,
                    args: row.get(6)?,
                    order_index: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(shortcuts)
    })
}

// 添加快捷方式
pub fn dashboard_add_shortcut(id: String, group_id: String, name: String, icon: Option<String>, url: String, run_as_admin: Option<bool>, args: Option<String>) -> Result<DashboardShortcut, String> {
    with_connection(|conn| {
        let now = chrono::Local::now().timestamp();
        let max_order: Option<i32> = conn.query_row(
            "SELECT MAX(order_index) FROM dashboard_shortcuts WHERE group_id = ?1",
            params![&group_id],
            |row| row.get(0)
        ).ok().flatten();
        let order_index = max_order.unwrap_or(-1) + 1;

        conn.execute(
            "INSERT INTO dashboard_shortcuts (id, group_id, name, icon, url, run_as_admin, args, order_index, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![&id, &group_id, &name, &icon, &url, run_as_admin.unwrap_or(false), &args, order_index, now, now],
        )?;

        Ok(DashboardShortcut {
            id,
            group_id,
            name,
            icon,
            url,
            run_as_admin,
            args,
            order_index,
            created_at: now,
            updated_at: now,
        })
    })
}

// 更新快捷方式分组
pub fn dashboard_update_shortcut_group(id: String, group_id: String) -> Result<(), String> {
    with_connection(|conn| {
        conn.execute(
            "UPDATE dashboard_shortcuts SET group_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![&group_id, chrono::Local::now().timestamp(), &id],
        )?;
        Ok(())
    })
}

// 更新快捷方式
pub fn dashboard_update_shortcut(id: String, name: String, icon: Option<String>, url: String, run_as_admin: Option<bool>, args: Option<String>) -> Result<DashboardShortcut, String> {
    with_connection(|conn| {
        let now = chrono::Local::now().timestamp();
        conn.execute(
            "UPDATE dashboard_shortcuts SET name = ?1, icon = ?2, url = ?3, run_as_admin = ?4, args = ?5, updated_at = ?6 WHERE id = ?7",
            params![&name, &icon, &url, run_as_admin.unwrap_or(false), &args, now, &id],
        )?;

        let shortcut = conn.query_row(
            "SELECT id, group_id, name, icon, url, run_as_admin, args, order_index, created_at, updated_at FROM dashboard_shortcuts WHERE id = ?1",
            params![&id],
            |row| {
                Ok(DashboardShortcut {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    name: row.get(2)?,
                    icon: row.get(3)?,
                    url: row.get(4)?,
                    run_as_admin: row.get(5)?,
                    args: row.get(6)?,
                    order_index: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            }
        )?;

        Ok(shortcut)
    })
}

// 删除快捷方式
pub fn dashboard_delete_shortcut(id: String) -> Result<(), String> {
    with_connection(|conn| {
        conn.execute(
            "DELETE FROM dashboard_shortcuts WHERE id = ?1",
            params![&id],
        )?;
        Ok(())
    })
}

// 重新排序快捷方式
pub fn dashboard_reorder_shortcuts(group_id: String, shortcuts: Vec<(String, i32)>) -> Result<(), String> {
    with_connection(|conn| {
        let tx = conn.unchecked_transaction()?;
        for (id, order_index) in shortcuts {
            tx.execute(
                "UPDATE dashboard_shortcuts SET order_index = ?1, updated_at = ?2 WHERE id = ?3 AND group_id = ?4",
                params![order_index, chrono::Local::now().timestamp(), &id, &group_id],
            )?;
        }
        tx.commit()?;
        Ok(())
    })
}

// 获取完整的启动板数据（分组和对应的快捷方式）
pub fn dashboard_get_dashboard_data() -> Result<Vec<(DashboardGroup, Vec<DashboardShortcut>)>, String> {
    let groups = dashboard_get_all_groups()?;
    let mut result = Vec::new();

    for group in groups {
        let shortcuts = dashboard_get_shortcuts_by_group(group.id.clone())?;
        result.push((group, shortcuts));
    }

    Ok(result)
}
