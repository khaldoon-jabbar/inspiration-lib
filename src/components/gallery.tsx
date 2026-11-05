"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FAMILIES } from "@/lib/families";
import type { LibraryItem } from "@/lib/types";
import { ChevronDown, GridIcon } from "./icons";
import { DetailModal } from "./detail-modal";

export function Gallery({
  items,
  initialFamily,
  initialItem,
}: {
  items: LibraryItem[];
  initialFamily: string;
  initialItem: string;
}) {
  const [openId, setOpenId] = useState(initialItem);
  const [dense, setDense] = useState(false);
  const [menu, setMenu] = useState(false);
  const serverKey = `${initialFamily}::${initialItem}`;
  const [seenKey, setSeenKey] = useState(serverKey);

  if (seenKey !== serverKey) {
    setSeenKey(serverKey);
    setOpenId(initialItem);
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("inspiration-lib-density");
    if (stored === "dense") setDense(true);
  }, []);

  const visible = initialFamily
    ? items.filter((item) => item.family === initialFamily)
    : items;
  const openItem = items.find((item) => item.id === openId) ?? null;

  function open(id: string) {
    setOpenId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("item", id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function close() {
    setOpenId("");
    const url = new URL(window.location.href);
    url.searchParams.delete("item");
    const search = url.searchParams.toString();
    window.history.replaceState(null, "", search ? `${url.pathname}?${search}` : url.pathname);
  }

  function chooseDensity(next: boolean) {
    setDense(next);
    setMenu(false);
    window.localStorage.setItem("inspiration-lib-density", next ? "dense" : "comfortable");
  }

  return (
    <div className="px-4 pb-16 pt-1 md:px-7">
      <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-[#1d1d1f]">
        <span className="border-b-[3px] border-[#ff3d9a] pb-0.5">Inspiration</span>
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#6e6e73]">
        Saved screenshots and pages, sorted by aesthetic family, with a prompt and a brief ready to hand off.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1">
          <Pill href="/" active={!initialFamily}>
            All
          </Pill>
          {FAMILIES.map((family) => (
            <Pill key={family.slug} href={`/?family=${family.slug}`} active={initialFamily === family.slug}>
              {family.label}
            </Pill>
          ))}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13.5px] font-medium"
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            <GridIcon width={15} height={15} />
            <span className="hidden sm:inline">Masonry</span>
            <ChevronDown width={14} height={14} />
          </button>
          {menu ? (
            <div className="absolute right-0 top-9 z-10 w-40 rounded-xl border border-[#ececef] bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#f4f4f5]"
                onClick={() => chooseDensity(false)}
              >
                Comfortable
                {!dense ? <span aria-hidden="true">✓</span> : null}
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#f4f4f5]"
                onClick={() => chooseDensity(true)}
              >
                Dense
                {dense ? <span aria-hidden="true">✓</span> : null}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-16 text-[15px] text-[#6e6e73]">Nothing in this family yet.</p>
      ) : (
        <div
          className={
            dense
              ? "mt-4 columns-2 gap-2 sm:columns-3 xl:columns-5"
              : "mt-4 columns-2 gap-3.5 lg:columns-3 xl:columns-4"
          }
        >
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item.id)}
              className="shot mb-3.5 block w-full overflow-hidden rounded-[16px] bg-[#e8e8ea] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1c1c1e]"
            >
              <img src={item.imageUrl} alt={item.title} className="block h-auto w-full" />
            </button>
          ))}
        </div>
      )}

      {openItem ? (
        <DetailModal item={openItem} items={visible.length ? visible : items} all={items} onClose={close} onOpen={open} />
      ) : null}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-medium ${
        active
          ? "bg-white text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.05)]"
          : "text-[#6b6b70] hover:bg-white/70 hover:text-[#1c1c1e]"
      }`}
    >
      {children}
    </Link>
  );
}
