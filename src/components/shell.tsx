"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { FAMILIES } from "@/lib/families";
import { LibraryIcon, Mark, PlusIcon } from "./icons";

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const family = params.get("family") ?? "";
  const onAdd = pathname === "/add";
  const crumb = onAdd ? "Add" : "Inspiration";

  return (
    <div className="flex h-dvh bg-white text-[#1c1c1e]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#efeff1] px-2.5 py-4 md:flex">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1">
          <Mark />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Inspiration Lib</span>
        </Link>

        <Link
          href="/add"
          className={`mt-4 flex items-center gap-3 rounded-xl px-2 py-1.5 ${
            onAdd ? "bg-[#f2f2f4]" : "hover:bg-[#f6f6f7]"
          }`}
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#ff3d9a] text-white">
            <PlusIcon width={16} height={16} strokeWidth={2.25} />
          </span>
          <span className="text-[14px] font-medium">Add</span>
        </Link>

        <nav className="mt-2" aria-label="Library">
          <Link
            href="/"
            className={`flex h-10 items-center gap-3 rounded-xl px-2.5 text-[14px] ${
              pathname === "/" && !family ? "bg-[#f2f2f4] font-medium" : "hover:bg-[#f6f6f7]"
            }`}
          >
            <LibraryIcon />
            Library
          </Link>
        </nav>

        <div className="mx-2 mt-3 border-t border-[#efeff1]" />
        <p className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8e8e93]">
          Families
        </p>
        <nav className="flex flex-col" aria-label="Aesthetic families">
          {FAMILIES.map((entry) => {
            const active = family === entry.slug;
            return (
              <Link
                key={entry.slug}
                href={`/?family=${entry.slug}`}
                title={entry.label}
                className={`flex h-9 items-center whitespace-nowrap rounded-lg px-2.5 text-left text-[13px] ${
                  active ? "bg-[#f2f2f4] font-medium" : "text-[#3a3a3e] hover:bg-[#f6f6f7]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {entry.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f6f6f7]">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-7">
          <Link href="/" className="md:hidden">
            <Mark width={26} height={26} />
          </Link>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13.5px] text-[#8e8e93]">
            <Link href="/" className="hover:text-[#1c1c1e]">
              Library
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-[#1c1c1e]">{crumb}</span>
          </nav>
          <Link
            href="/add"
            className="ml-auto grid size-8 place-items-center rounded-[10px] bg-[#ff3d9a] text-white md:hidden"
            aria-label="Add"
          >
            <PlusIcon width={16} height={16} strokeWidth={2.25} />
          </Link>
        </header>
        <div id="content" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#f6f6f7]" />}>
      <ShellFrame>{children}</ShellFrame>
    </Suspense>
  );
}
