use discord_rich_presence::activity::{Activity, ActivityType, Assets, Timestamps};
use discord_rich_presence::{DiscordIpc, DiscordIpcClient};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, Sender};
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::webview::{DownloadEvent, Webview};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl};

mod blocker;
mod media;

const STORE_FILE: &str = "agamiz-data.json";

struct DownloadState(Mutex<Option<PathBuf>>);

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyResponse {
    ok: bool,
    status: Option<u16>,
    data: Option<Value>,
}

#[tauri::command]
async fn tmdb_proxy(url: String, api_key: String) -> Result<ProxyResponse, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("accept", "application/json")
        .header("authorization", format!("Bearer {api_key}"))
        .send()
        .await
        .map_err(|e| format!("proxy request failed: {e}"))?;

    let status = response.status().as_u16();

    if (200..300).contains(&status) {
        let data: Value = response.json().await.map_err(|e| format!("bad json: {e}"))?;
        Ok(ProxyResponse {
            ok: true,
            status: Some(status),
            data: Some(data),
        })
    } else {
        Ok(ProxyResponse {
            ok: false,
            status: Some(status),
            data: None,
        })
    }
}

#[tauri::command]
fn __agamiz_backend(
    app: tauri::AppHandle,
    op: String,
    key: String,
    value: Option<Value>,
) -> Result<Option<Value>, String> {
    let path = store_path(&app)?;

    let mut store: Map<String, Value> = if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        Map::new()
    };

    match op.as_str() {
        "read" => Ok(store.get(&key).cloned()),
        "write" => {
            store.insert(key, value.unwrap_or(Value::Null));
            persist(&path, &store)?;
            Ok(None)
        }
        "clear" => {
            store.remove(&key);
            persist(&path, &store)?;
            Ok(None)
        }
        _ => Err(format!("unknown store op: {op}")),
    }
}

fn store_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("could not create data dir: {e}"))?;
    Ok(dir.join(STORE_FILE))
}

fn persist(path: &PathBuf, store: &Map<String, Value>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn system_info() -> String {
    format!("{} / {}", std::env::consts::OS, std::env::consts::ARCH)
}

const DISCORD_APP_ID: &str = "1534325741162860732";
const DISCORD_LARGE_IMAGE: &str = "logo";

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RpcPresence {
    title: String,
    media_type: String,
    season: Option<u32>,
    episode: Option<u32>,
}

enum RpcCommand {
    SetPresence(RpcPresence),
    Clear,
    Shutdown,
}

struct DiscordRpc(Sender<RpcCommand>);

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn rpc_worker(rx: mpsc::Receiver<RpcCommand>) {
    let mut client = DiscordIpcClient::new(DISCORD_APP_ID);
    let mut connected = false;

    for cmd in rx {
        match cmd {
            RpcCommand::SetPresence(p) => {
                if !connected {
                    if client.connect().is_ok() {
                        connected = true;
                    } else {
                        continue;
                    }
                }

                let state = if p.media_type == "tv" {
                    match (p.season, p.episode) {
                        (Some(s), Some(e)) => format!("S{s} E{e}"),
                        _ => "TV Series".to_string(),
                    }
                } else {
                    "Movie".to_string()
                };

                let activity = Activity::new()
                    .activity_type(ActivityType::Watching)
                    .details(format!("Watching {} on Agamiz Cinema", p.title))
                    .state(state)
                    .assets(
                        Assets::new()
                            .large_image(DISCORD_LARGE_IMAGE)
                            .large_text("Agamiz Cinema"),
                    )
                    .timestamps(Timestamps::new().start(now_ms()));

                if client.set_activity(activity).is_err() {
                    connected = false;
                }
            }
            RpcCommand::Clear => {
                let _ = client.clear_activity();
            }
            RpcCommand::Shutdown => {
                let _ = client.clear_activity();
                let _ = client.close();
                break;
            }
        }
    }
}

#[tauri::command]
fn set_discord_presence(app: AppHandle, presence: Option<RpcPresence>) -> Result<(), String> {
    let rpc = app.state::<DiscordRpc>();
    let cmd = match presence {
        Some(p) => RpcCommand::SetPresence(p),
        None => RpcCommand::Clear,
    };
    rpc.0.send(cmd).map_err(|e| format!("rpc channel closed: {e}"))
}

fn configured_download_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let state = app.state::<DownloadState>();
    let guard = state.0.lock().map_err(|e| format!("lock failed: {e}"))?;
    let mut dir = match guard.as_ref() {
        Some(p) if !p.as_os_str().is_empty() => p.clone(),
        _ => app
            .path()
            .download_dir()
            .map_err(|e| format!("could not resolve download dir: {e}"))?,
    };
    drop(guard);
    if !dir.is_absolute() {
        if let Ok(home) = app.path().home_dir() {
            dir = home.join(dir);
        }
    }
    fs::create_dir_all(&dir).map_err(|e| format!("could not create download dir: {e}"))?;
    Ok(dir)
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h), Some(l)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                out.push(h * 16 + l);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn sanitize_filename(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' | '\0' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = cleaned.trim_matches(['.', ' ']);
    if trimmed.is_empty() {
        "download".into()
    } else {
        trimmed.to_string()
    }
}

fn suggested_filename(url: &tauri::Url, destination: &Path) -> String {
    let candidate = destination
        .file_name()
        .and_then(|n| n.to_str())
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            url.path_segments()
                .and_then(|mut s| s.next_back())
                .map(percent_decode)
                .unwrap_or_else(|| "download".into())
        });
    sanitize_filename(&candidate)
}

fn download_handler(webview: Webview, event: DownloadEvent<'_>) -> bool {
    let app = webview.app_handle();
    match event {
        DownloadEvent::Requested { url, destination } => {
            match configured_download_dir(app) {
                Ok(dir) => {
                    let target = dir.join(suggested_filename(&url, destination));
                    *destination = target.clone();
                    let _ = app.emit(
                        "download://started",
                        serde_json::json!({
                            "url": url.to_string(),
                            "path": target.to_string_lossy(),
                        }),
                    );
                    true
                }
                Err(e) => {
                    let _ = app.emit(
                        "download://error",
                        serde_json::json!({ "url": url.to_string(), "error": e }),
                    );
                    false
                }
            }
        }
        DownloadEvent::Finished { url, path, success } => {
            let _ = app.emit(
                "download://finished",
                serde_json::json!({
                    "url": url.to_string(),
                    "path": path.map(|p| p.to_string_lossy().into_owned()),
                    "success": success,
                }),
            );
            true
        }
        _ => true,
    }
}

#[tauri::command]
fn set_download_path(app: AppHandle, path: String) -> Result<(), String> {
    let state = app.state::<DownloadState>();
    let mut guard = state.0.lock().map_err(|e| format!("lock failed: {e}"))?;
    *guard = if path.trim().is_empty() {
        None
    } else {
        Some(PathBuf::from(path.trim()))
    };
    Ok(())
}

#[tauri::command]
fn get_default_download_dir(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("could not resolve download dir: {e}"))?;
    Ok(dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn open_download_folder(path: String) -> Result<(), String> {
    let p = PathBuf::from(path);
    if !p.exists() {
        fs::create_dir_all(&p).map_err(|e| format!("could not create folder: {e}"))?;
    }
    open_in_file_manager(&p)
}

#[cfg(target_os = "windows")]
fn open_in_file_manager(path: &Path) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(path)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("could not open folder: {e}"))
}

#[cfg(target_os = "macos")]
fn open_in_file_manager(path: &Path) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(path)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("could not open folder: {e}"))
}

#[cfg(target_os = "linux")]
fn open_in_file_manager(path: &Path) -> Result<(), String> {
    std::process::Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("could not open folder: {e}"))
}

#[tauri::command]
fn open_download_window(
    app: AppHandle,
    tmdb_id: u64,
    media_type: String,
    title: String,
    season: Option<u32>,
    episode: Option<u32>,
) -> Result<String, String> {
    let is_tv = media_type == "tv";
    let s = season.unwrap_or(1);
    let e = episode.unwrap_or(1);
    let url = if is_tv {
        format!("https://vidsync.live/embed/tv/{tmdb_id}/{s}/{e}")
    } else {
        format!("https://vidsync.live/embed/movie/{tmdb_id}")
    };
    let label = format!("download-{media_type}-{tmdb_id}-{s}-{e}");

    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.set_focus();
        return Ok(label);
    }

    let parsed = url
        .parse::<tauri::Url>()
        .map_err(|e| format!("invalid url: {e}"))?;
    let win_title = if is_tv {
        format!("Download — {title} S{s}E{e}")
    } else {
        format!("Download — {title}")
    };

    let download_builder =
        tauri::WebviewWindowBuilder::new(&app, label.as_str(), WebviewUrl::External(parsed))
            .title(win_title)
            .inner_size(760.0, 500.0)
            .min_inner_size(520.0, 360.0)
            .resizable(true)
            .on_download(download_handler);
    let window = blocker::harden(download_builder, blocker::WindowMode::Embedded)
        .build()
        .map_err(|e| format!("could not open download window: {e}"))?;
    let _ = window.center();

    Ok(label)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(DownloadState(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle();
            let (tx, rx) = mpsc::channel::<RpcCommand>();
            std::thread::spawn(move || rpc_worker(rx));
            app.manage(DiscordRpc(tx));
            let main_builder = tauri::WebviewWindowBuilder::new(
                handle,
                "main",
                WebviewUrl::App("index.html".into()),
            )
            .title("Agamiz Cinema")
            .inner_size(1360.0, 860.0)
            .min_inner_size(980.0, 640.0)
            .resizable(true)
            .fullscreen(false)
            .decorations(false)
            .background_color(tauri::webview::Color(4, 21, 14, 255))
            .on_download(download_handler);
            blocker::harden(main_builder, blocker::WindowMode::App)
                .build()
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            media::setup(handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            tmdb_proxy,
            __agamiz_backend,
            system_info,
            set_download_path,
            get_default_download_dir,
            open_download_folder,
            open_download_window,
            set_discord_presence
        ])
        .build(tauri::generate_context!())
        .expect("error while building Agamiz Cinema")
        .run(move |app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(rpc) = app.try_state::<DiscordRpc>() {
                    let _ = rpc.0.send(RpcCommand::Shutdown);
                }
            }
        });
}
