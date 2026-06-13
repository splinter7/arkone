"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { MediaCategory } from "@/lib/media-types";
import { getCopyUrlLabel, getCopyUrlToast } from "@/lib/media-types";
import {
  clampPage,
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  paginateItems,
} from "@/lib/pagination";
import type { Asset } from "@/lib/types";
import { staggerDelay } from "@/lib/motion";
import { MediaPlayer } from "./MediaPlayer";
import { Pagination } from "./Pagination";
import { PreviewPreloader } from "./PreviewPreloader";
import { useToast } from "./ToastProvider";

interface MediaGalleryProps {
  refreshKey: number;
}

interface PlaybackState {
  url: string;
  asset: Asset;
  expiresAt: number;
}

interface ThumbnailState {
  url: string;
  expiresAt: number;
}

type CategoryFilter = "all" | MediaCategory;
type SortOption = "newest" | "oldest" | "name";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
];

async function fetchPlaybackUrl(
  cid: string,
): Promise<{ url: string; expiresIn: number } | null> {
  const response = await apiFetch(`/api/media/${encodeURIComponent(cid)}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { url: string; expiresIn: number };
  return { url: data.url, expiresIn: data.expiresIn };
}

async function fetchThumbnailUrl(
  cid: string,
): Promise<{ url: string; expiresIn: number } | null> {
  const response = await apiFetch(
    `/api/media/${encodeURIComponent(cid)}/thumbnail`,
  );
  if (!response.ok) return null;

  const data = (await response.json()) as { url: string; expiresIn: number };
  return { url: data.url, expiresIn: data.expiresIn };
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path
        d="M10 9.5v5l5-2.5-5-2.5z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ThumbnailPlaceholder({ category }: { category: MediaCategory }) {
  if (category === "video") {
    return (
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
        aria-hidden="true"
      >
        <VideoIcon />
      </div>
    );
  }

  if (category === "audio") {
    return (
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
        aria-hidden="true"
      >
        <AudioIcon />
      </div>
    );
  }

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-medium tracking-wider text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
      aria-hidden="true"
    >
      IMG
    </div>
  );
}

function AssetThumbnail({
  asset,
  thumbnail,
  loading,
}: {
  asset: Asset;
  thumbnail?: ThumbnailState;
  loading: boolean;
}) {
  if (asset.category === "video" || asset.category === "audio") {
    return <ThumbnailPlaceholder category={asset.category} />;
  }

  if (loading) {
    return (
      <div
        className="h-16 w-16 shrink-0 animate-shimmer rounded-md"
        aria-hidden="true"
      />
    );
  }

  if (!thumbnail?.url) {
    return <ThumbnailPlaceholder category={asset.category} />;
  }

  return (
    <img
      src={thumbnail.url}
      alt=""
      className="h-16 w-16 shrink-0 rounded-md object-cover bg-neutral-100 dark:bg-neutral-800"
    />
  );
}

function GallerySkeleton() {
  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {Array.from({ length: 3 }, (_, index) => (
        <li
          key={index}
          className="animate-fade-in-up py-3"
          style={staggerDelay(index)}
        >
          <div className="space-y-2">
            <div className="flex gap-4">
              <div className="h-16 w-16 shrink-0 animate-shimmer rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-shimmer rounded" />
                <div className="h-3 w-32 animate-shimmer rounded" />
              </div>
            </div>
            <div className="flex gap-4 pt-1">
              <div className="h-3 w-14 animate-shimmer rounded" />
              <div className="h-3 w-16 animate-shimmer rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const actionButtonClass =
  "underline-offset-4 transition-all duration-150 hover:underline active:scale-[0.98] disabled:cursor-wait disabled:opacity-50";

export function MediaGallery({ refreshKey }: MediaGalleryProps) {
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [playback, setPlayback] = useState<Record<string, PlaybackState>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailState>>({});
  const [loadingThumbnailCids, setLoadingThumbnailCids] = useState<Set<string>>(
    new Set(),
  );
  const requestedThumbnailGeneration = useRef(new Set<string>());
  const [loadingCid, setLoadingCid] = useState<string | null>(null);
  const [expandedCid, setExpandedCid] = useState<string | null>(null);
  const [confirmDeleteCid, setConfirmDeleteCid] = useState<string | null>(null);
  const [deletingCid, setDeletingCid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setListError(null);

      const response = await apiFetch("/api/media");
      if (!response.ok) {
        if (!cancelled) {
          setListError("Failed to load assets");
          toast.error("Failed to load assets");
          setLoading(false);
        }
        return;
      }

      const data = (await response.json()) as { assets: Asset[] };
      if (!cancelled) {
        setAssets(data.assets);
        setLoading(false);
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, toast]);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = assets.filter((asset) => {
      if (categoryFilter !== "all" && asset.category !== categoryFilter) {
        return false;
      }

      if (!query) return true;

      return (
        asset.name.toLowerCase().includes(query) ||
        asset.cid.toLowerCase().includes(query) ||
        asset.mimeType.toLowerCase().includes(query)
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      const aTime = new Date(a.uploadedAt).getTime();
      const bTime = new Date(b.uploadedAt).getTime();
      return sortBy === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [assets, searchQuery, categoryFilter, sortBy]);

  const totalPages = getTotalPages(filteredAssets.length, DEFAULT_PAGE_SIZE);
  const currentPage = clampPage(page, totalPages);

  useEffect(() => {
    setPage(1);
    requestedThumbnailGeneration.current.clear();
  }, [searchQuery, categoryFilter, sortBy, refreshKey]);

  useEffect(() => {
    setPage((current) => clampPage(current, totalPages));
  }, [totalPages]);

  const paginatedAssets = useMemo(
    () => paginateItems(filteredAssets, currentPage, DEFAULT_PAGE_SIZE),
    [filteredAssets, currentPage],
  );

  const refreshAssets = useCallback(async () => {
    const response = await apiFetch("/api/media");
    if (!response.ok) return;

    const data = (await response.json()) as { assets: Asset[] };
    setAssets(data.assets);
  }, []);

  const loadThumbnail = useCallback(
    async (asset: Asset, force = false) => {
      if (!force && thumbnails[asset.cid]) {
        const existing = thumbnails[asset.cid];
        if (Date.now() < existing.expiresAt - 60_000) return;
      }

      setLoadingThumbnailCids((current) => new Set(current).add(asset.cid));

      const data = await fetchThumbnailUrl(asset.cid);

      if (data) {
        setThumbnails((prev) => ({
          ...prev,
          [asset.cid]: {
            url: data.url,
            expiresAt: Date.now() + data.expiresIn * 1000,
          },
        }));
      }

      setLoadingThumbnailCids((current) => {
        const next = new Set(current);
        next.delete(asset.cid);
        return next;
      });
    },
    [thumbnails],
  );

  useEffect(() => {
    let cancelled = false;

    async function ensureThumbnails() {
      for (const asset of paginatedAssets) {
        if (cancelled) return;

        if (asset.category === "video" || asset.category === "audio") {
          continue;
        }

        if (asset.thumbnailCid) {
          await loadThumbnail(asset);
          continue;
        }

        if (requestedThumbnailGeneration.current.has(asset.cid)) {
          continue;
        }

        requestedThumbnailGeneration.current.add(asset.cid);
        setLoadingThumbnailCids((current) => new Set(current).add(asset.cid));

        const response = await apiFetch(
          `/api/media/${encodeURIComponent(asset.cid)}/thumbnail`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          },
        );

        if (cancelled) return;

        setLoadingThumbnailCids((current) => {
          const next = new Set(current);
          next.delete(asset.cid);
          return next;
        });

        if (response.ok) {
          await refreshAssets();
          await loadThumbnail(asset, true);
        }
      }
    }

    void ensureThumbnails();

    return () => {
      cancelled = true;
    };
  }, [paginatedAssets, loadThumbnail, refreshAssets]);

  const loadPlayback = useCallback(async (asset: Asset, force = false) => {
    if (!force && playback[asset.cid]) {
      const existing = playback[asset.cid];
      if (Date.now() < existing.expiresAt - 60_000) return;
    }

    setLoadingCid(asset.cid);

    const data = await fetchPlaybackUrl(asset.cid);

    if (!data) {
      toast.error(`Failed to load ${asset.name}`);
      setLoadingCid(null);
      setExpandedCid(null);
      return;
    }

    setPlayback((prev) => ({
      ...prev,
      [asset.cid]: {
        url: data.url,
        asset,
        expiresAt: Date.now() + data.expiresIn * 1000,
      },
    }));
    setLoadingCid(null);
  }, [playback, toast]);

  const handlePreview = useCallback(
    (asset: Asset) => {
      if (expandedCid === asset.cid) {
        setExpandedCid(null);
        return;
      }

      setExpandedCid(asset.cid);
      void loadPlayback(asset);
    },
    [expandedCid, loadPlayback],
  );

  async function copyPlaybackUrl(asset: Asset) {
    let url = playback[asset.cid]?.url;

    if (!url) {
      const data = await fetchPlaybackUrl(asset.cid);
      if (!data) {
        toast.error(`Failed to copy URL for ${asset.name}`);
        return;
      }
      url = data.url;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(getCopyUrlToast(asset.category));
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  async function deleteAsset(asset: Asset) {
    setDeletingCid(asset.cid);

    const response = await apiFetch(
      `/api/media/${encodeURIComponent(asset.cid)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(
        (body as { error?: string }).error ?? `Failed to delete ${asset.name}`,
      );
      setDeletingCid(null);
      setConfirmDeleteCid(null);
      return;
    }

    setAssets((current) => current.filter((item) => item.cid !== asset.cid));
    setPlayback((current) => {
      const next = { ...current };
      delete next[asset.cid];
      return next;
    });
    setThumbnails((current) => {
      const next = { ...current };
      delete next[asset.cid];
      return next;
    });
    requestedThumbnailGeneration.current.delete(asset.cid);
    if (expandedCid === asset.cid) {
      setExpandedCid(null);
    }
    setConfirmDeleteCid(null);
    setDeletingCid(null);
    toast.success(`${asset.name} deleted`);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Library
        </h2>

        {!loading && assets.length > 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {filteredAssets.length === assets.length
              ? `${assets.length} assets`
              : `${filteredAssets.length} of ${assets.length} assets`}
          </p>
        )}
      </div>

      {!loading && assets.length > 0 && (
        <div className="animate-fade-in flex flex-col gap-4">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, CID, or type…"
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none transition-colors duration-200 focus:border-neutral-900 dark:border-neutral-600 dark:focus:border-neutral-100"
            aria-label="Search assets"
          />

          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by category"
            >
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setCategoryFilter(filter.value)}
                  className={`rounded-full px-3 py-1 text-xs transition-all duration-200 active:scale-[0.97] ${
                    categoryFilter === filter.value
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              Sort
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="border-b border-neutral-300 bg-transparent py-1 text-sm outline-none dark:border-neutral-600"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {loading && <GallerySkeleton />}
      {listError && (
        <p className="animate-fade-in text-sm text-red-600 dark:text-red-400">
          {listError}
        </p>
      )}

      {!loading && assets.length === 0 && (
        <p className="animate-fade-in text-sm text-neutral-500 dark:text-neutral-400">
          No media uploaded yet.
        </p>
      )}

      {!loading && assets.length > 0 && filteredAssets.length === 0 && (
        <p className="animate-fade-in text-sm text-neutral-500 dark:text-neutral-400">
          No assets match your search.
        </p>
      )}

      <ul
        key={`page-${currentPage}`}
        className="divide-y divide-neutral-200 dark:divide-neutral-800"
      >
        {paginatedAssets.map((asset, index) => {
          const isExpanded = expandedCid === asset.cid;

          return (
          <li
            key={asset.cid}
            className={`animate-fade-in-up transition-[padding] duration-500 ease-out ${
              isExpanded ? "py-6" : "py-3"
            }`}
            style={staggerDelay(index)}
          >
            <div className="flex gap-4">
              <AssetThumbnail
                asset={asset}
                thumbnail={thumbnails[asset.cid]}
                loading={loadingThumbnailCids.has(asset.cid)}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {asset.mimeType}
                </p>
                <p className="text-xs break-all text-neutral-400 dark:text-neutral-500">
                  {asset.cid}
                </p>
                <div className="flex flex-wrap gap-4 pt-1 text-sm">
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => handlePreview(asset)}
                  disabled={loadingCid === asset.cid}
                >
                  {loadingCid === asset.cid
                    ? "Loading…"
                    : isExpanded
                      ? "Hide"
                      : "Preview"}
                </button>
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => copyPlaybackUrl(asset)}
                >
                  {getCopyUrlLabel(asset.category)}
                </button>
                {confirmDeleteCid === asset.cid ? (
                  <span className="animate-fade-in flex flex-wrap gap-4">
                    <button
                      type="button"
                      className={`${actionButtonClass} text-red-600 dark:text-red-400`}
                      onClick={() => deleteAsset(asset)}
                      disabled={deletingCid === asset.cid}
                    >
                      {deletingCid === asset.cid ? "Deleting…" : "Confirm delete"}
                    </button>
                    <button
                      type="button"
                      className={actionButtonClass}
                      onClick={() => setConfirmDeleteCid(null)}
                      disabled={deletingCid === asset.cid}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`${actionButtonClass} text-red-600 dark:text-red-400`}
                    onClick={() => setConfirmDeleteCid(asset.cid)}
                  >
                    Delete
                  </button>
                )}
              </div>
              </div>
            </div>
            <div
              className={`preview-panel ${
                isExpanded ? "preview-panel-expanded" : "preview-panel-collapsed"
              }`}
            >
              <div className="overflow-hidden min-h-0">
                {isExpanded && (
                  <div className="relative min-h-80 w-full animate-fade-in-up">
                    {loadingCid === asset.cid && (
                      <PreviewPreloader label="Fetching playback URL…" />
                    )}
                    {playback[asset.cid] && loadingCid !== asset.cid && (
                      <MediaPlayer
                        key={playback[asset.cid].url}
                        url={playback[asset.cid].url}
                        category={asset.category}
                        name={asset.name}
                        onUrlExpired={() => loadPlayback(asset, true)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
          );
        })}
      </ul>

      {!loading && filteredAssets.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredAssets.length}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
