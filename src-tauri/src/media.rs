use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutEvent, ShortcutState};

pub const MEDIA_EVENT: &str = "window://media";
const MAIN_LABEL: &str = "main";

pub fn emit_media(app: &AppHandle, action: &str) {
    let _ = app.emit(MEDIA_EVENT, action);
}

pub fn register_media_keys(app: &AppHandle) {
    let gs = app.global_shortcut();
    let binds: &[(&str, Code)] = &[
        ("toggle-play", Code::MediaPlayPause),
        ("next", Code::MediaTrackNext),
        ("previous", Code::MediaTrackPrevious),
    ];
    for (action, code) in binds {
        let action = action.to_string();
        let shortcut = Shortcut::new(Some(Modifiers::empty()), *code);
        if let Err(e) = gs.on_shortcut(shortcut, move |app, _ctx: &Shortcut, event: ShortcutEvent| {
            if event.state == ShortcutState::Pressed {
                emit_media(app, &action);
            }
        }) {
            eprintln!("[media] failed to register {code:?}: {e}");
        }
    }
}

fn toggle_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(MAIN_LABEL) {
        let visible = win.is_visible().unwrap_or(false);
        if visible {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

fn render_tray_icon() -> tauri::image::Image<'static> {
    const SIZE: u32 = 32;
    let mut rgba = vec![0u8; (SIZE * SIZE * 4) as usize];
    let (ax, ay) = (11.0, 9.0);
    let (bx, by) = (11.0, 23.0);
    let (cx, cy) = (25.0, 16.0);
    let (r, g, b, a) = (155u8, 233u8, 198u8, 255u8);

    for row in 0..SIZE as u32 {
        for col in 0..SIZE as u32 {
            let (px, py) = (col as f64 + 0.5, row as f64 + 0.5);
            if within_tri(px, py, ax, ay, bx, by, cx, cy) {
                let i = ((row * SIZE + col) * 4) as usize;
                rgba[i] = r;
                rgba[i + 1] = g;
                rgba[i + 2] = b;
                rgba[i + 3] = a;
            }
        }
    }
    tauri::image::Image::new_owned(rgba, SIZE, SIZE)
}

fn within_tri(
    px: f64,
    py: f64,
    ax: f64,
    ay: f64,
    bx: f64,
    by: f64,
    cx: f64,
    cy: f64,
) -> bool {
    let s: [bool; 3] = [
        cross(px, py, ax, ay, bx, by) <= 0.0,
        cross(px, py, bx, by, cx, cy) <= 0.0,
        cross(px, py, cx, cy, ax, ay) <= 0.0,
    ];
    s[0] && s[1] && s[2]
}

#[allow(clippy::too_many_arguments)]
fn cross(px: f64, py: f64, ax: f64, ay: f64, bx: f64, by: f64) -> f64 {
    (bx - ax) * (py - ay) - (by - ay) * (px - ax)
}

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle-play", "Play / Pause", true, None::<&str>)?;
    let next = MenuItem::with_id(app, "next", "Next Episode", true, None::<&str>)?;
    let prev = MenuItem::with_id(app, "previous", "Previous Episode", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let show = MenuItem::with_id(app, "show-window", "Show / Hide Window", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Agamiz Cinema", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &next, &prev, &sep, &show, &sep, &quit])?;

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true)
        .icon(render_tray_icon())
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            match id {
                "toggle-play" | "next" | "previous" => emit_media(app, id),
                "show-window" => toggle_window(app),
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app)?;

    std::mem::forget(tray);
    Ok(())
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    create_tray(app)?;
    register_media_keys(app);
    Ok(())
}