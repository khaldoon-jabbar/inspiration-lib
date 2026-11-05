"use client";

import { useEffect, useId, useState } from "react";
import { familyLabel } from "@/lib/families";
import { relativeTime } from "@/lib/time";
import type { LibraryItem } from "@/lib/types";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  CopyIcon,
  ExternalIcon,
  GridIcon,
} from "./icons";

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

export function DetailModal({
  item,
  items,
  all,
  onClose,
  onOpen,
}: {
  item: LibraryItem;
  items: LibraryItem[];
  all: LibraryItem[];
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const titleId = useId();
  const index = Math.max(0, items.findIndex((entry) => entry.id === item.id));
  const [zoom, setZoom] = useState(100);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"prompt" | "brief" | null>(null);
  const [similarOpen, setSimilarOpen] = useState(false);

  const similar = all.filter((entry) => entry.family === item.family && entry.id !== item.id).slice(0, 6);

  useEffect(() => {
    setZoom(100);
    setExpanded(false);
    setCopied(null);
    setSimilarOpen(false);
  }, [item.id]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && items[index + 1]) onOpen(items[index + 1].id);
      if (event.key === "ArrowLeft" && items[index - 1]) onOpen(items[index - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, items, onClose, onOpen]);

  async function copy(kind: "prompt" | "brief", text: string) {
    await writeClipboard(text);
    setCopied(kind);
    window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1600);
  }

  const longPrompt = item.imagePrompt.length > 180;

  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-black/45" aria-label="Close detail" onClick={onClose} />

      <button
        type="button"
        aria-label="Previous reference"
        disabled={!items[index - 1]}
        onClick={() => items[index - 1] && onOpen(items[index - 1].id)}
        className="absolute left-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1c1c1e] shadow-[0_8px_24px_rgba(0,0,0,0.18)] disabled:opacity-40 lg:grid"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        aria-label="Next reference"
        disabled={!items[index + 1]}
        onClick={() => items[index + 1] && onOpen(items[index + 1].id)}
        className="absolute right-3 top-1/2 z-30 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1c1c1e] shadow-[0_8px_24px_rgba(0,0,0,0.18)] disabled:opacity-40 lg:grid"
      >
        <ChevronRight />
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-3 z-20 flex overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:inset-y-6 md:left-16 md:right-16 lg:left-[4.5rem] lg:right-[4.5rem]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white text-[#1c1c1e] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <CloseIcon />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid min-h-[240px] flex-1 place-items-center overflow-hidden px-4 py-8 md:px-10">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-h-full max-w-full object-contain"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
          <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e6e6ea] bg-white px-3 text-[13px]"
                aria-expanded={similarOpen}
                onClick={() => setSimilarOpen((value) => !value)}
              >
                <GridIcon width={14} height={14} />
                Similar images
                <ChevronDown width={14} height={14} />
              </button>
              {similarOpen ? (
                <div className="absolute bottom-11 left-0 z-10 w-72 rounded-xl border border-[#ececef] bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                  {similar.length === 0 ? (
                    <p className="px-2 py-2 text-[13px] text-[#6e6e73]">No other references in this family yet.</p>
                  ) : (
                    similar.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onOpen(entry.id)}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-[#f4f4f5]"
                      >
                        <img src={entry.imageUrl} alt="" className="size-10 rounded-md object-cover" />
                        <span className="line-clamp-2 text-[13px]">{entry.title}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            <label className="flex items-center gap-3 text-[12px] text-[#6e6e73]">
              <span className="w-10 text-right tabular-nums">{zoom}%</span>
              <input
                type="range"
                min={80}
                max={140}
                value={zoom}
                aria-label="Zoom"
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-28"
              />
            </label>
          </div>
        </div>

        <aside className="flex w-[min(100%,340px)] shrink-0 flex-col border-l border-[#eee] bg-[#f6f6f7] max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[68%] max-md:rounded-t-2xl max-md:border-l-0">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-12 md:pt-6">
            <h2 id={titleId} className="pr-8 text-[17px] font-semibold leading-snug tracking-[-0.02em]">
              {item.title}
            </h2>
            <p className="mt-1 text-[12px] text-[#8e8e93]">{relativeTime(item.createdAt)}</p>

            <p className="mt-5 text-[11px] font-semibold tracking-[0.08em] text-[#e06a45]">TLDR</p>
            <p className="mt-2 rounded-xl border border-[#f0d0c4] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[#3a3a3e]">
              {item.explanation}
            </p>

            <p className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-[#8e8e93]">TAGS</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.keywords.map((keyword) => (
                <li
                  key={keyword}
                  className="inline-flex h-7 items-center rounded-full border border-[#e6e6ea] bg-white px-2.5 text-[12.5px] text-[#3f3f46]"
                >
                  {keyword}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-[#8e8e93]">PROMPT</p>
            <p className={`mt-2 text-[13.5px] leading-relaxed text-[#2c2c2e] ${expanded ? "" : "line-clamp-4"}`}>
              {item.imagePrompt}
            </p>
            {longPrompt ? (
              <button
                type="button"
                className="mt-1 text-[13.5px] font-medium text-[#2f6bff]"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "See less" : "See more"}
              </button>
            ) : null}

            <p className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-[#8e8e93]">SETTINGS</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {[item.aspect, familyLabel(item.family), item.sorter].map((pill) => (
                <li
                  key={pill}
                  className="inline-flex h-7 items-center rounded-lg border border-[#e7e7ea] bg-white px-2.5 text-[12.5px] text-[#3a3a3e]"
                >
                  {pill}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 px-5 pb-5 pt-2">
            <p className="sr-only" aria-live="polite">
              {copied === "prompt" ? "Image prompt copied" : copied === "brief" ? "Brief copied" : ""}
            </p>
            <button
              type="button"
              onClick={() => void copy("prompt", item.imagePrompt)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1c1c1e] text-[14px] font-medium text-white"
            >
              <CopyIcon width={16} height={16} />
              {copied === "prompt" ? "Copied" : "Copy image prompt"}
            </button>
            <button
              type="button"
              onClick={() => void copy("brief", item.siteBrief)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] bg-white text-[14px] font-medium"
            >
              <CopyIcon width={16} height={16} />
              {copied === "brief" ? "Copied" : "Copy brief"}
            </button>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] bg-white text-[14px] font-medium"
              >
                <ExternalIcon width={16} height={16} />
                Open source
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
