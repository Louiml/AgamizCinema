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
  Settings2,
  HardDriveDownload,
  FolderOpen,
  DatabaseBackup,
  FileDown,
  FileUp,
  Mic2,
  Languages,
  FastForward,
  Wand2,
} from "lucide-react";
import { useHistory } from "@/providers/HistoryProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { changeLanguage, type AppLanguage } from "@/i18n";
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
  return (
    !!obj &&
    typeof obj.id === "number" &&
    (obj.mediaType === "movie" || obj.mediaType === "tv")
  );
}

function sanitizeWatchlist(data: unknown): WatchlistItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(isValidMediaRef)
    .map((x) => ({
      id: x.id,
      mediaType: x.mediaType,
      title: String((x as Partial<WatchlistItem>).title ?? "Untitled"),
      posterPath:
        typeof (x as Partial<WatchlistItem>).posterPath === "string"
          ? ((x as Partial<WatchlistItem>).posterPath as string)
          : null,
      backdropPath:
        typeof (x as Partial<WatchlistItem>).backdropPath === "string"
          ? ((x as Partial<WatchlistItem>).backdropPath as string)
          : null,
      voteAverage:
        typeof (x as Partial<WatchlistItem>).voteAverage === "number"
          ? ((x as Partial<WatchlistItem>).voteAverage as number)
          : 0,
      releaseDate:
        typeof (x as Partial<WatchlistItem>).releaseDate === "string"
          ? ((x as Partial<WatchlistItem>).releaseDate as string)
          : undefined,
      addedAt:
        typeof (x as Partial<WatchlistItem>).addedAt === "number"
          ? ((x as Partial<WatchlistItem>).addedAt as number)
          : Date.now(),
    }));
}

function sanitizeHistory(data: unknown): HistoryItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(isValidMediaRef)
    .map((x) => ({
      id: x.id,
      mediaType: x.mediaType,
      title: String((x as Partial<HistoryItem>).title ?? "Untitled"),
      posterPath:
        typeof (x as Partial<HistoryItem>).posterPath === "string"
          ? ((x as Partial<HistoryItem>).posterPath as string)
          : null,
      backdropPath:
        typeof (x as Partial<HistoryItem>).backdropPath === "string"
          ? ((x as Partial<HistoryItem>).backdropPath as string)
          : null,
      voteAverage:
        typeof (x as Partial<HistoryItem>).voteAverage === "number"
          ? ((x as Partial<HistoryItem>).voteAverage as number)
          : 0,
      releaseDate:
        typeof (x as Partial<HistoryItem>).releaseDate === "string"
          ? ((x as Partial<HistoryItem>).releaseDate as string)
          : undefined,
      progress:
        typeof (x as Partial<HistoryItem>).progress === "number"
          ? Math.min(100, Math.max(0, (x as Partial<HistoryItem>).progress as number))
          : 0,
      watchedAt:
        typeof (x as Partial<HistoryItem>).watchedAt === "number"
          ? ((x as Partial<HistoryItem>).watchedAt as number)
          : Date.now(),
      season:
        typeof (x as Partial<HistoryItem>).season === "number"
          ? ((x as Partial<HistoryItem>).season as number)
          : undefined,
      episode:
        typeof (x as Partial<HistoryItem>).episode === "number"
          ? ((x as Partial<HistoryItem>).episode as number)
          : undefined,
    }));
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const { open } = usePlayer();
  return (
    <div
      onClick={() =>
        open({
          tmdbId: item.id,
          mediaType: item.mediaType,
          title: item.title,
          season: item.season,
          episode: item.episode,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          voteAverage: item.voteAverage,
        })
      }
      className="glass-card group flex cursor-pointer items-center gap-3 rounded-2xl p-2.5"
    >
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
        {item.posterPath ? (
          <img src={item.posterPath} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ash-dim">
            <MonitorPlay className="h-4 w-4" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-ink-deep/0 opacity-0 transition-all duration-ui ease-spring group-hover:bg-ink-deep/50 group-hover:opacity-100">
          <PlayCircle className="h-6 w-6 text-mint-300" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-paper group-hover:text-mint-300">
          {item.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ash">
          {item.mediaType === "tv" && item.season ? (
            <span>S{item.season}E{item.episode}</span>
          ) : (
            <span>{item.mediaType}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(item.watchedAt)}
          </span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-mint-400 to-emerald-500"
              style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-ash">{Math.round(item.progress)}%</span>
        </div>
      </div>
      <RatingBadge rating={item.voteAverage} size="sm" />
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
  icon?: typeof PlayCircle;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-paper">
          {Icon && <Icon className="h-4 w-4 text-mint-400" />}
          {title}
        </p>
        {desc && <p className="text-xs text-ash">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const {
    items: history,
    clear: clearHistory,
    remove: removeHistory,
    replace: replaceHistory,
  } = useHistory();
  const {
    items: watchlistItems,
    count: watchlistCount,
    clear: clearWatchlist,
    replace: replaceWatchlist,
  } = useWatchlist();
  const { settings, update } = useSettings();

  const [confirmHistory, setConfirmHistory] = useState(false);
  const [confirmWatchlist, setConfirmWatchlist] = useState(false);
  const [defaultDownloadDir, setDefaultDownloadDir] = useState("");
  const [pickingFolder, setPickingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!downloadSupported()) return;
    getDefaultDownloadDir()
      .then(setDefaultDownloadDir)
      .catch(() => setDefaultDownloadDir(""));
  }, []);

  const handleExport = () => {
    const payload: BackupPayload = {
      app: "agamiz-cinema",
      version: 1,
      exportedAt: new Date().toISOString(),
      watchlist: watchlistItems,
      history: history,
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agamiz-cinema-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ message: t("toasts.backupExported"), tone: "success" });
    } catch {
      toast({ message: t("toasts.backupExportFailed"), tone: "error" });
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      const watchlist = sanitizeWatchlist(data.watchlist);
      const historyItems = sanitizeHistory(data.history);
      if (watchlist.length === 0 && historyItems.length === 0) {
        toast({ message: t("toasts.backupImportFailed"), tone: "error" });
        return;
      }
      replaceWatchlist(watchlist);
      replaceHistory(historyItems);
      toast({ message: t("toasts.backupImported"), tone: "success" });
    } catch {
      toast({ message: t("toasts.backupImportFailed"), tone: "error" });
    }
  };

  const handleBrowse = async () => {
    setPickingFolder(true);
    try {
      const picked = await pickDownloadFolder();
      if (picked) update({ downloadPath: picked });
    } finally {
      setPickingFolder(false);
    }
  };

  const downloadPath = settings.downloadPath ?? "";

  const handleOpenFolder = async () => {
    const target = downloadPath.trim() || defaultDownloadDir;
    if (!target) return;
    await openDownloadFolder(target).catch((err) => {
      console.warn("[settings] could not open downloads folder.", err);
    });
  };

  const glassLevels = [
    { value: "light", label: t("settings.light") },
    { value: "medium", label: t("settings.medium") },
    { value: "heavy", label: t("settings.heavy") },
  ] as const;

  const LANGUAGES: Array<{ code: AppLanguage; codeLabel: string }> = [
    { code: "en", codeLabel: "EN" },
    { code: "he", codeLabel: "HE" },
    { code: "ru", codeLabel: "RU" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="animate-fade-in-up">
        <h1 className="heading-display flex items-center gap-3 text-3xl text-paper sm:text-4xl">
          <Settings2 className="h-8 w-8 text-mint-400" /> {t("settings.title")}
        </h1>
        <p className="mt-1.5 text-sm text-ash">{t("settings.subtitle")}</p>
      </div>

      {/* Preferences */}
      <section className="glass-panel space-y-5 rounded-3xl p-6 animate-fade-in-up">
        <h2 className="flex items-center gap-2 font-semibold text-paper">
          <PlayCircle className="h-4 w-4 text-mint-400" /> {t("settings.preferences")}
        </h2>

        <SettingRow title={t("settings.autoplay")} desc={t("settings.autoplayDesc")}>
          <Toggle
            checked={settings.autoplay}
            onChange={(v) => update({ autoplay: v })}
            label={t("settings.autoplay")}
          />
        </SettingRow>

        <SettingRow title={t("settings.defaultSource")} desc={t("settings.defaultSourceDesc")}>
          <GlassSelect
            value={settings.defaultSource}
            onChange={(v) => update({ defaultSource: v })}
            options={[
              { value: "vidsync", label: "vidsync.live" },
              { value: "vidsrc", label: "vidsrc.to (backup)" },
              { value: "vidnest", label: "vidnest.fun" },
              { value: "videasy", label: "player.videasy.net" },
              { value: "cinesrc", label: "cinesrc.st" },
              { value: "vidrock", label: "vidrock.net" },
            ]}
            ariaLabel={t("settings.defaultSource")}
          />
        </SettingRow>

        <SettingRow
          title={
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-mint-400" /> {t("settings.language")}
            </span>
          }
          desc={t("settings.languageDesc")}
        >
          <div className="flex gap-1.5">
            {LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => void changeLanguage(lang.code)}
                  className={`chip min-w-12 justify-center px-3 py-1.5 ${active ? "chip-active" : ""}`}
                >
                  {lang.codeLabel}
                </button>
              );
            })}
          </div>
        </SettingRow>

        <SettingRow
          title={
            <span className="flex items-center gap-1.5">
              <FastForward className="h-4 w-4 text-mint-400" /> {t("settings.autoSkip")}
            </span>
          }
          desc={t("settings.autoSkipDesc")}
        >
          <Toggle
            checked={settings.autoSkip}
            onChange={(v) => update({ autoSkip: v })}
            label={t("settings.autoSkip")}
          />
        </SettingRow>

        <SettingRow
          title={
            <span className="flex items-center gap-1.5">
              <Wand2 className="h-4 w-4 text-mint-400" /> {t("settings.cleanViewSetting")}
            </span>
          }
          desc={t("settings.cleanViewSettingDesc")}
        >
          <Toggle
            checked={settings.cleanView}
            onChange={(v) => update({ cleanView: v })}
            label={t("settings.cleanViewSetting")}
          />
        </SettingRow>

        {isTauri() && (
          <SettingRow
            title={
              <span className="flex items-center gap-1.5">
                <Mic2 className="h-4 w-4 text-mint-400" /> {t("settings.discordRpc")}
              </span>
            }
            desc={t("settings.discordRpcDesc")}
          >
            <Toggle
              checked={settings.discordRpc}
              onChange={(v) => update({ discordRpc: v })}
              label={t("settings.toggleDiscordRpc")}
            />
          </SettingRow>
        )}

        <SettingRow title={t("settings.showAds")} desc={t("settings.adsNote")}>
          <Toggle
            checked={settings.showAds}
            onChange={(v) => update({ showAds: v })}
            label={t("settings.showAds")}
          />
        </SettingRow>

        <SettingRow
          title={
            <span className="flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-mint-400" /> {t("settings.glassOpacity")}
            </span>
          }
          desc={t("settings.glassOpacityDesc")}
        >
          <div className="flex gap-1.5">
            {glassLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => update({ glassOpacity: level.value })}
                className={`chip px-3 py-1.5 ${
                  settings.glassOpacity === level.value ? "chip-active" : ""
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </SettingRow>
      </section>

      {/* Downloads */}
      <section className="glass-panel space-y-4 rounded-3xl p-6 animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-paper">
            <HardDriveDownload className="h-4 w-4 text-mint-400" /> {t("settings.downloads")}
          </h2>
          <p className="mt-1 text-xs text-ash">
            {t("settings.downloadsDesc", { source: settings.defaultSource })}
          </p>
        </div>

        {downloadSupported() ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={downloadPath}
                onChange={(e) => update({ downloadPath: e.target.value })}
                placeholder={t("settings.downloadsPathPlaceholder")}
                aria-label={t("settings.downloads")}
                className="input-glass min-w-0 flex-1 basis-64"
              />
              <button
                onClick={handleBrowse}
                disabled={pickingFolder}
                className="btn-glass text-sm disabled:pointer-events-none disabled:opacity-50"
              >
                <FolderOpen className="h-4 w-4" />
                {pickingFolder ? t("settings.choosing") : t("settings.browse")}
              </button>
              <button
                onClick={handleOpenFolder}
                className="btn-glass text-sm"
                title={t("settings.openFolder")}
              >
                {t("settings.openFolder")}
              </button>
            </div>
            <p className="text-xs text-ash">
              {downloadPath.trim()
                ? t("settings.savingTo", { path: downloadPath.trim() })
                : defaultDownloadDir
                  ? t("settings.usingSystemFolder", { path: defaultDownloadDir })
                  : t("settings.usingDownloadsFolder")}
            </p>
          </>
        ) : (
          <p className="text-xs text-ash">{t("settings.downloadsNotAvailable")}</p>
        )}
      </section>

      {/* Backup & Restore */}
      <section className="glass-panel space-y-4 rounded-3xl p-6 animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-paper">
            <DatabaseBackup className="h-4 w-4 text-mint-400" />
            {t("settings.backupRestore")}
          </h2>
          <p className="mt-1 text-xs text-ash">{t("settings.backupDesc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="btn-glass text-sm">
            <FileDown className="h-4 w-4" /> {t("settings.exportJson")}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-glass text-sm"
          >
            <FileUp className="h-4 w-4" /> {t("settings.importJson")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label={t("settings.importJson")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {/* Watch History */}
      <section className="space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-paper">
              <History className="h-4 w-4 text-mint-400" /> {t("settings.whatSeen")}
              <span className="glass-mint rounded-full px-2.5 py-0.5 text-[11px] font-bold text-mint-300">
                {history.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-ash">{t("settings.whatSeenDesc")}</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setConfirmHistory(true)}
              className="btn-glass text-sm text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" /> {t("settings.clearHistory")}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon={Eye}
            title={t("settings.noHistory")}
            description={t("settings.noHistoryDesc")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {history.slice(0, 12).map((item) => (
              <div key={`${item.mediaType}:${item.id}`} className="relative">
                <HistoryCard item={item} />
                <button
                  onClick={() => removeHistory(item.id, item.mediaType)}
                  aria-label={t("settings.removeFromHistory", { title: item.title })}
                  className="absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-deep/80 text-ash backdrop-blur transition-all duration-ui ease-spring hover:text-rose-300 active:scale-90 active:duration-press"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Watchlist management */}
      <section className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 animate-fade-in-up">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-paper">
            <Bookmark className="h-4 w-4 text-mint-400" /> {t("settings.watchlist")}
          </h2>
          <p className="mt-1 text-sm text-ash">
            {t("settings.watchlistCount", { count: watchlistCount })}
          </p>
        </div>
        <button
          onClick={() => setConfirmWatchlist(true)}
          disabled={watchlistCount === 0}
          className="btn-glass text-sm text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/10 disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" /> {t("settings.clearWatchlist")}
        </button>
      </section>

      {/* Confirmation modals */}
      <GlassModal
        open={confirmHistory}
        onClose={() => setConfirmHistory(false)}
        title={t("settings.clearHistoryTitle")}
        description={t("settings.clearHistoryDesc")}
        icon={History}
        confirmLabel={t("settings.clearHistory")}
        destructive
        onConfirm={clearHistory}
      />
      <GlassModal
        open={confirmWatchlist}
        onClose={() => setConfirmWatchlist(false)}
        title={t("settings.clearWatchlistTitle")}
        description={t("settings.clearWatchlistDesc", { count: watchlistCount })}
        icon={Bookmark}
        confirmLabel={t("settings.clearWatchlist")}
        destructive
        onConfirm={clearWatchlist}
      />
    </div>
  );
}
