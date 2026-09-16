import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  History,
  Trash2,
  Bookmark,
  Palette,
  PlayCircle,
  Clock,
  MonitorPlay,
  Eye,
  HardDriveDownload,
  FolderOpen,
  DatabaseBackup,
  FileDown,
  FileUp,
  Mic2,
  ShieldOff,
  Languages,
  FastForward,
  Wand2,
  Sun,
  Moon,
  BookOpen,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useHistory } from "@/providers/HistoryProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { changeLanguage, type AppLanguage } from "@/i18n";
import type { AppTheme } from "@/types/app";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Toggle } from "@/components/ui/Toggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { toast } from "@/lib/toast";
import { timeAgo } from "@/lib/media";
import { isTauri } from "@/services/tauri";
import {
  downloadSupported,
  getDefaultDownloadDir,
  openDownloadFolder,
  pickDownloadFolder,
} from "@/services/download";
import type { HistoryItem, WatchlistItem } from "@/types/app";

// ── helpers (unchanged) ──────────────────────────────────────

interface BackupPayload {
  app?: string;
  version?: number;
  exportedAt?: string;
  watchlist?: unknown;
  history?: unknown;
}

interface MediaRefLike {
  id: number;
  mediaType: "movie" | "tv";
}

function isValidMediaRef(x: unknown): x is MediaRefLike {
  const obj = x as MediaRefLike;
  return !!obj && typeof obj.id === "number" && (obj.mediaType === "movie" || obj.mediaType === "tv");
}

function sanitizeWatchlist(data: unknown): WatchlistItem[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isValidMediaRef).map((x) => ({
    id: x.id, mediaType: x.mediaType,
    title: String((x as Partial<WatchlistItem>).title ?? "Untitled"),
    posterPath: typeof (x as Partial<WatchlistItem>).posterPath === "string" ? (x as Partial<WatchlistItem>).posterPath as string : null,
    backdropPath: typeof (x as Partial<WatchlistItem>).backdropPath === "string" ? (x as Partial<WatchlistItem>).backdropPath as string : null,
    voteAverage: typeof (x as Partial<WatchlistItem>).voteAverage === "number" ? (x as Partial<WatchlistItem>).voteAverage as number : 0,
    releaseDate: typeof (x as Partial<WatchlistItem>).releaseDate === "string" ? (x as Partial<WatchlistItem>).releaseDate as string : undefined,
    addedAt: typeof (x as Partial<WatchlistItem>).addedAt === "number" ? (x as Partial<WatchlistItem>).addedAt as number : Date.now(),
  }));
}

function sanitizeHistory(data: unknown): HistoryItem[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isValidMediaRef).map((x) => ({
    id: x.id, mediaType: x.mediaType,
    title: String((x as Partial<HistoryItem>).title ?? "Untitled"),
    posterPath: typeof (x as Partial<HistoryItem>).posterPath === "string" ? (x as Partial<HistoryItem>).posterPath as string : null,
    backdropPath: typeof (x as Partial<HistoryItem>).backdropPath === "string" ? (x as Partial<HistoryItem>).backdropPath as string : null,
    voteAverage: typeof (x as Partial<HistoryItem>).voteAverage === "number" ? (x as Partial<HistoryItem>).voteAverage as number : 0,
    releaseDate: typeof (x as Partial<HistoryItem>).releaseDate === "string" ? (x as Partial<HistoryItem>).releaseDate as string : undefined,
    progress: typeof (x as Partial<HistoryItem>).progress === "number" ? Math.min(100, Math.max(0, (x as Partial<HistoryItem>).progress as number)) : 0,
    watchedAt: typeof (x as Partial<HistoryItem>).watchedAt === "number" ? (x as Partial<HistoryItem>).watchedAt as number : Date.now(),
    season: typeof (x as Partial<HistoryItem>).season === "number" ? (x as Partial<HistoryItem>).season as number : undefined,
    episode: typeof (x as Partial<HistoryItem>).episode === "number" ? (x as Partial<HistoryItem>).episode as number : undefined,
  }));
}

// ── sub-components ────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h2 className="text-sm font-medium text-on-primary">{title}</h2>
    </div>
  );
}

function SettingRow({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-on-primary">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-accent" />}
          {title}
        </p>
        {desc && <p className="mt-0.5 text-xs text-shade-50">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const { open } = usePlayer();
  return (
    <div
      onClick={() => open({ tmdbId: item.id, mediaType: item.mediaType, title: item.title, season: item.season, episode: item.episode, posterPath: item.posterPath, backdropPath: item.backdropPath, voteAverage: item.voteAverage })}
      className="surface-light group flex cursor-pointer items-center gap-3 rounded-md p-2.5"
    >
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-shade-30">
        {item.posterPath ? (
          <img src={item.posterPath} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-shade-50"><MonitorPlay className="h-4 w-4" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-on-primary">{item.title}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-shade-50">
          {item.mediaType === "tv" && item.season ? <span>S{item.season}E{item.episode}</span> : <span>{item.mediaType}</span>}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(item.watchedAt)}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-pill bg-shade-30">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} />
          </div>
          <span className="text-[10px] font-medium text-shade-50">{Math.round(item.progress)}%</span>
        </div>
      </div>
      <RatingBadge rating={item.voteAverage} size="sm" />
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { items: history, clear: clearHistory, remove: removeHistory, replace: replaceHistory } = useHistory();
  const { items: watchlistItems, count: watchlistCount, clear: clearWatchlist, replace: replaceWatchlist } = useWatchlist();
  const { settings, update } = useSettings();

  const [confirmHistory, setConfirmHistory] = useState(false);
  const [confirmWatchlist, setConfirmWatchlist] = useState(false);
  const [defaultDownloadDir, setDefaultDownloadDir] = useState("");
  const [pickingFolder, setPickingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!downloadSupported()) return;
    getDefaultDownloadDir().then(setDefaultDownloadDir).catch(() => setDefaultDownloadDir(""));
  }, []);

  const handleExport = () => {
    const payload: BackupPayload = { app: "agamiz-cinema", version: 1, exportedAt: new Date().toISOString(), watchlist: watchlistItems, history };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agamiz-cinema-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ message: t("toasts.backupExported"), tone: "success" });
    } catch { toast({ message: t("toasts.backupExportFailed"), tone: "error" }); }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      const wl = sanitizeWatchlist(data.watchlist);
      const hl = sanitizeHistory(data.history);
      if (wl.length === 0 && hl.length === 0) { toast({ message: t("toasts.backupImportFailed"), tone: "error" }); return; }
      replaceWatchlist(wl);
      replaceHistory(hl);
      toast({ message: t("toasts.backupImported"), tone: "success" });
    } catch { toast({ message: t("toasts.backupImportFailed"), tone: "error" }); }
  };

  const handleBrowse = async () => {
    setPickingFolder(true);
    try { const picked = await pickDownloadFolder(); if (picked) update({ downloadPath: picked }); } finally { setPickingFolder(false); }
  };

  const downloadPath = settings.downloadPath ?? "";

  const handleOpenFolder = async () => {
    const target = downloadPath.trim() || defaultDownloadDir;
    if (!target) return;
    await openDownloadFolder(target).catch(() => undefined);
  };

  const glassLevels = [
    { value: "off", label: t("settings.glassOff") },
    { value: "light", label: t("settings.light") },
    { value: "medium", label: t("settings.medium") },
    { value: "heavy", label: t("settings.heavy") },
  ] as const;

  const themes: Array<{ value: AppTheme; label: string; swatch: string }> = [
    { value: "noir", label: t("settings.themeNoir"), swatch: "#000000" },
    { value: "mint", label: t("settings.themeMint"), swatch: "#10b981" },
    { value: "rose", label: t("settings.themeRose"), swatch: "#e11d48" },
    { value: "amber", label: t("settings.themeAmber"), swatch: "#d97706" },
    { value: "violet", label: t("settings.themeViolet"), swatch: "#7c3aed" },
    { value: "azure", label: t("settings.themeAzure"), swatch: "#0284c7" },
  ];

  const LANGUAGES: Array<{ code: AppLanguage; codeLabel: string; country: string }> = [
    { code: "en", codeLabel: "EN", country: "gb" },
    { code: "he", codeLabel: "HE", country: "il" },
    { code: "ru", codeLabel: "RU", country: "ru" },
    { code: "de", codeLabel: "DE", country: "de" },
    { code: "ar", codeLabel: "AR", country: "sa" },
    { code: "it", codeLabel: "IT", country: "it" },
    { code: "ja", codeLabel: "JA", country: "jp" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Heading */}
      <div className="animate-fade-in-up">
        <h1 className="heading-display text-2xl text-on-primary sm:text-3xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-shade-50">{t("settings.subtitle")}</p>
      </div>

      {/* ── Playback ── */}
      <section className="surface-dark space-y-3 rounded-lg p-5 animate-fade-in-up sm:p-6">
        <SectionHeader icon={PlayCircle} title={t("settings.preferences")} />

        <SettingRow title={t("settings.autoplay")} desc={t("settings.autoplayDesc")}>
          <Toggle checked={settings.autoplay} onChange={(v) => update({ autoplay: v })} label={t("settings.autoplay")} />
        </SettingRow>

        <SettingRow title={t("settings.defaultSource")} desc={t("settings.defaultSourceDesc")}>
          <GlassSelect value={settings.defaultSource} onChange={(v) => update({ defaultSource: v })} compact
            options={[
              { value: "vidsync", label: "vidsync.live" },
              { value: "vidsrc", label: "vidsrc.to" },
              { value: "vidnest", label: "vidnest.fun" },
              { value: "videasy", label: "videasy.net" },
              { value: "cinesrc", label: "cinesrc.st" },
              { value: "vidrock", label: "vidrock.net" },
              { value: "vidcore", label: "vidcore.net" },
              { value: "stellar", label: "stellar.rip" },
              { value: "zxcstream", label: "zxcstream.xyz" },
              { value: "peachify", label: "peachify.top" },
            ]}
            ariaLabel={t("settings.defaultSource")} />
        </SettingRow>

        <SettingRow icon={FastForward} title={t("settings.autoSkip")} desc={t("settings.autoSkipDesc")}>
          <Toggle checked={settings.autoSkip} onChange={(v) => update({ autoSkip: v })} label={t("settings.autoSkip")} />
        </SettingRow>

        <SettingRow icon={Wand2} title={t("settings.cleanViewSetting")} desc={t("settings.cleanViewSettingDesc")}>
          <Toggle checked={settings.cleanView} onChange={(v) => update({ cleanView: v })} label={t("settings.cleanViewSetting")} />
        </SettingRow>

        <SettingRow icon={ShieldOff} title={t("settings.blockPopups")} desc={t("settings.blockPopupsDesc")}>
          <Toggle checked={settings.blockPopups} onChange={(v) => update({ blockPopups: v })} label={t("settings.blockPopups")} />
        </SettingRow>

        {isTauri() && (
          <SettingRow icon={Mic2} title={t("settings.discordRpc")} desc={t("settings.discordRpcDesc")}>
            <Toggle checked={settings.discordRpc} onChange={(v) => update({ discordRpc: v })} label={t("settings.toggleDiscordRpc")} />
          </SettingRow>
        )}
      </section>

      {/* ── Appearance ── */}
      <section className="surface-dark space-y-3 rounded-lg p-5 animate-fade-in-up sm:p-6" style={{ animationDelay: "60ms" }}>
        <SectionHeader icon={Palette} title={t("settings.theme")} />

        {/* Theme swatches */}
        <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-on-primary">
              <Palette className="h-4 w-4 text-accent" /> {t("settings.theme")}
            </p>
            <p className="mt-0.5 text-xs text-shade-50">{t("settings.themeDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => {
              const active = settings.theme === theme.value;
              return (
                <button key={theme.value} onClick={() => update({ theme: theme.value })} title={theme.label}
                  className={`flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-medium transition-all duration-ui active:scale-[0.96] ${
                    active ? "border-accent bg-accent text-accent-on" : "border-hairline-light bg-canvas-light text-shade-60 hover:text-on-primary"
                  }`}>
                  <span className="h-4 w-4 rounded-pill border border-black/10" style={{ backgroundColor: theme.swatch }} aria-hidden />
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Light / Dark */}
        <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-on-primary">
              {settings.themeMode === "light" ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-accent" />}
              {t("settings.themeMode")}
            </p>
            <p className="mt-0.5 text-xs text-shade-50">{t("settings.themeModeDesc")}</p>
          </div>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((mode) => {
              const active = settings.themeMode === mode;
              const Icon = mode === "light" ? Sun : Moon;
              return (
                <button key={mode} onClick={() => update({ themeMode: mode })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-ui active:scale-[0.96] ${
                    active ? "border-accent bg-accent text-accent-on" : "border-hairline-light bg-canvas-light text-shade-60 hover:text-on-primary"
                  }`}>
                  <Icon className="h-4 w-4" />
                  {mode === "light" ? t("settings.modeLight") : t("settings.modeDark")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Surface material */}
        <SettingRow icon={SlidersHorizontal} title={t("settings.glassOpacity")} desc={t("settings.glassOpacityDesc")}>
          <div className="flex gap-1.5">
            {glassLevels.map((level) => (
              <button key={level.value} onClick={() => update({ glassOpacity: level.value })}
                className={`chip-light px-3 py-1.5 ${settings.glassOpacity === level.value ? "chip-active" : ""}`}>
                {level.label}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Manga reader mode */}
        {isTauri() && (
          <SettingRow icon={BookOpen} title={t("settings.mangaReaderMode")} desc={t("settings.mangaReaderModeDesc")}>
            <div className="flex gap-1.5">
              {(["scroll", "paged"] as const).map((m) => (
                <button key={m} onClick={() => update({ mangaReaderMode: m })}
                  className={`chip-light px-3 py-1.5 ${settings.mangaReaderMode === m ? "chip-active" : ""}`}>
                  {m === "scroll" ? t("manga.scrollMode") : t("manga.pagedMode")}
                </button>
              ))}
            </div>
          </SettingRow>
        )}

        {/* Manga reading direction */}
        {isTauri() && (
          <SettingRow icon={BookOpen} title={t("settings.mangaReadingDirection")} desc={t("settings.mangaReadingDirectionDesc")}>
            <div className="flex gap-1.5">
              {(["rtl", "ltr"] as const).map((d) => (
                <button key={d} onClick={() => update({ mangaReadingDirection: d })}
                  className={`chip-light px-3 py-1.5 ${settings.mangaReadingDirection === d ? "chip-active" : ""}`}>
                  {d === "rtl" ? t("manga.rtl") : t("manga.ltr")}
                </button>
              ))}
            </div>
          </SettingRow>
        )}
      </section>

      {/* ── Language ── */}
      <section className="surface-dark space-y-3 rounded-lg p-5 animate-fade-in-up sm:p-6" style={{ animationDelay: "120ms" }}>
        <SectionHeader icon={Languages} title={t("settings.language")} />
        <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
          <p className="text-xs text-shade-50">{t("settings.languageDesc")}</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <button key={lang.code} onClick={() => void changeLanguage(lang.code)}
                  className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition-all duration-ui active:scale-[0.96] ${
                    active ? "border-accent bg-accent text-accent-on" : "border-hairline-light bg-canvas-light text-shade-60 hover:text-on-primary"
                  }`}>
                  <span className={`fi fi-${lang.country} text-[1.05em] leading-none`} aria-hidden />
                  {lang.codeLabel}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Downloads ── */}
      <section className="surface-dark space-y-3 rounded-lg p-5 animate-fade-in-up sm:p-6" style={{ animationDelay: "180ms" }}>
        <SectionHeader icon={HardDriveDownload} title={t("settings.downloads")} />
        {downloadSupported() ? (
          <>
            <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
              <p className="text-xs text-shade-50">{t("settings.downloadsDesc", { source: settings.defaultSource })}</p>
              <div className="flex flex-wrap items-center gap-2">
                <input value={downloadPath} onChange={(e) => update({ downloadPath: e.target.value })}
                  placeholder={t("settings.downloadsPathPlaceholder")} aria-label={t("settings.downloads")}
                  className="input-light min-w-0 flex-1" />
                <button onClick={handleBrowse} disabled={pickingFolder}
                  className="btn-outline-on-light px-4 py-2.5 text-sm disabled:opacity-50">
                  <FolderOpen className="h-4 w-4" />
                  {pickingFolder ? t("settings.choosing") : t("settings.browse")}
                </button>
                <button onClick={handleOpenFolder} className="btn-outline-on-light px-4 py-2.5 text-sm">
                  {t("settings.openFolder")}
                </button>
              </div>
              <p className="text-xs text-shade-50">
                {downloadPath.trim() ? t("settings.savingTo", { path: downloadPath.trim() })
                  : defaultDownloadDir ? t("settings.usingSystemFolder", { path: defaultDownloadDir })
                  : t("settings.usingDownloadsFolder")}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
            <p className="text-xs text-shade-50">{t("settings.downloadsNotAvailable")}</p>
          </div>
        )}
      </section>

      {/* ── Backup & Restore ── */}
      <section className="surface-dark space-y-3 rounded-lg p-5 animate-fade-in-up sm:p-6" style={{ animationDelay: "240ms" }}>
        <SectionHeader icon={DatabaseBackup} title={t("settings.backupRestore")} />
        <div className="flex flex-col gap-3 rounded-md border border-hairline-light bg-canvas-elevated/40 p-4">
          <p className="text-xs text-shade-50">{t("settings.backupDesc")}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="btn-outline-on-light px-4 py-2.5 text-sm">
              <FileDown className="h-4 w-4" /> {t("settings.exportJson")}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-outline-on-light px-4 py-2.5 text-sm">
              <FileUp className="h-4 w-4" /> {t("settings.importJson")}
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden"
              aria-label={t("settings.importJson")}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImportFile(file); e.target.value = ""; }} />
          </div>
        </div>
      </section>

      {/* ── Watch History ── */}
      <section className="space-y-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between gap-3">
          <SectionHeader icon={History} title={t("settings.whatSeen")} />
          {history.length > 0 && (
            <button onClick={() => setConfirmHistory(true)}
              className="btn-outline-on-light px-4 py-2 text-xs text-rose-500 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" /> {t("settings.clearHistory")}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState icon={Eye} title={t("settings.noHistory")} description={t("settings.noHistoryDesc")} />
        ) : (
          <div className="surface-dark rounded-lg p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {history.slice(0, 12).map((item) => (
                <div key={`${item.mediaType}:${item.id}`} className="relative">
                  <HistoryCard item={item} />
                  <button onClick={() => removeHistory(item.id, item.mediaType)}
                    aria-label={t("settings.removeFromHistory", { title: item.title })}
                    className="absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-pill bg-canvas-light text-shade-60 shadow-elev-3 transition-all hover:text-rose-500 active:scale-90">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Watchlist ── */}
      <section className="surface-dark flex flex-wrap items-center justify-between gap-4 rounded-lg p-5 animate-fade-in-up sm:p-6" style={{ animationDelay: "360ms" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Bookmark className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-medium text-on-primary">{t("settings.watchlist")}</h2>
            <p className="mt-0.5 text-xs text-shade-50">{t("settings.watchlistCount", { count: watchlistCount })}</p>
          </div>
        </div>
        <button onClick={() => setConfirmWatchlist(true)} disabled={watchlistCount === 0}
          className="btn-outline-on-light px-4 py-2.5 text-sm text-rose-500 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40">
          <Trash2 className="h-4 w-4" /> {t("settings.clearWatchlist")}
        </button>
      </section>

      {/* Confirmation modals */}
      <GlassModal open={confirmHistory} onClose={() => setConfirmHistory(false)}
        title={t("settings.clearHistoryTitle")} description={t("settings.clearHistoryDesc")}
        icon={History} confirmLabel={t("settings.clearHistory")} destructive onConfirm={clearHistory} />
      <GlassModal open={confirmWatchlist} onClose={() => setConfirmWatchlist(false)}
        title={t("settings.clearWatchlistTitle")} description={t("settings.clearWatchlistDesc", { count: watchlistCount })}
        icon={Bookmark} confirmLabel={t("settings.clearWatchlist")} destructive onConfirm={clearWatchlist} />
    </div>
  );
}
