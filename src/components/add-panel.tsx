"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LinkIcon, PlusIcon, StackIcon } from "./icons";
import { LinkModal } from "./link-modal";

export function AddPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  async function uploadFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Drop a PNG, JPG, WebP, or GIF.");
      return;
    }
    setPending(true);
    setError("");
    let lastId = "";
    try {
      for (const file of images.slice(0, 6)) {
        setMessage(`Sorting ${file.name}…`);
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/upload", { method: "POST", body });
        const data = (await response.json()) as { item?: { id: string }; error?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.error || `Could not save ${file.name}.`);
        }
        lastId = data.item.id;
      }
      router.push(`/?item=${lastId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that image.");
      setPending(false);
      setMessage("");
    }
  }

  return (
    <div className="flex h-full min-h-full flex-col px-4 pb-6 pt-1 md:px-8 md:pb-8">
      <div className="flex items-center gap-2.5">
        <span className="text-[#1c1c1e]">
          <StackIcon width={28} height={28} />
        </span>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">New reference</h1>
      </div>
      <p className="mt-2 text-[15px] text-[#8d8d93]">
        Organize screenshots and page links for the library.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6e6ea] bg-white px-3 text-[13.5px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)] disabled:opacity-50"
        >
          <PlusIcon width={15} height={15} strokeWidth={2} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6e6ea] bg-white px-3 text-[13.5px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)] disabled:opacity-50"
        >
          <LinkIcon width={15} height={15} />
          Webpage
        </button>
      </div>

      <div
        className={`mt-3 grid min-h-[440px] flex-1 place-items-center rounded-2xl border bg-white ${
          over ? "border-[#ff3d9a]" : "border-[#ececef]"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <div className="px-6 text-center">
          <div className="mx-auto grid place-items-center">
            <StackIcon />
          </div>
          <p className="mt-6 text-[15px] text-[#1c1c1e]">
            {message || "Drag and drop files here"}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="mt-4 h-9 rounded-lg bg-[#f2f2f4] px-4 text-[14px] font-medium text-[#1c1c1e] disabled:opacity-50"
          >
            Upload
          </button>
          {error ? (
            <p role="alert" className="mt-4 text-[13px] text-[#9f1239]">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />

      <LinkModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSaved={(id) => {
          setLinkOpen(false);
          router.push(`/?item=${id}`);
          router.refresh();
        }}
      />
    </div>
  );
}
