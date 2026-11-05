"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon, HomeIcon, LinkIcon } from "./icons";

export function LinkModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const titleId = useId();
  const urlRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => urlRef.current?.focus(), 30);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        document.getElementById("link-save")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  async function save() {
    const trimmed = url.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed, note }),
      });
      const data = (await response.json()) as { item?: { id: string }; error?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.error || "Could not read that page.");
      }
      setUrl("");
      setNote("");
      onSaved(data.item.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read that page.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <button className="absolute inset-0 cursor-default" aria-label="Close link dialog" onClick={onClose} />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-[560px] rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="flex items-center gap-2 text-[16px] font-semibold">
            <LinkIcon />
            Link
          </h2>
          <button type="button" className="grid size-8 place-items-center rounded-lg text-[#6e6e73] hover:bg-[#f4f4f5]" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <label className="sr-only" htmlFor="link-url">
          Link
        </label>
        <input
          id="link-url"
          ref={urlRef}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Type or paste a link..."
          inputMode="url"
          autoComplete="off"
          className="mt-4 h-11 w-full rounded-lg border border-[#e4e4e8] px-3 text-[14px] outline-none placeholder:text-[#b0b0b6] focus-visible:border-[#1c1c1e]"
        />

        <label className="sr-only" htmlFor="link-note">
          Note
        </label>
        <textarea
          id="link-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Say something about it... (optional)"
          className="mt-3 h-28 w-full resize-none rounded-lg border border-[#e4e4e8] px-3 py-3 text-[14px] outline-none placeholder:text-[#b0b0b6] focus-visible:border-[#1c1c1e]"
        />

        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-[#9f1239]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span
            className="grid size-9 place-items-center rounded-lg border border-[#e4e4e8] text-[#1c1c1e]"
            title="Saves to Library"
          >
            <HomeIcon width={16} height={16} />
            <span className="sr-only">Saves to Library</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-lg bg-[#ececef] px-3 text-[13.5px] font-medium text-[#1c1c1e]"
            >
              Cancel
              <span className="ml-2 text-[11px] font-medium text-[#8e8e93]">ESC</span>
            </button>
            <button
              id="link-save"
              type="submit"
              disabled={!url.trim() || pending}
              className="inline-flex h-9 items-center rounded-lg bg-[#4d4d52] px-3 text-[13.5px] font-medium text-white disabled:opacity-45"
            >
              {pending ? "Saving…" : "Save"}
              <span className="ml-2 text-[11px] font-medium text-white/70">⌘↵</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
