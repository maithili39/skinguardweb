"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function IngredientSearch({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
        params.delete("page");
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      {/* Search icon */}
      <svg
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        id="ingredient-search"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search ingredients… e.g. Niacinamide, Glycerin"
        className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-5 text-sm text-text-dark shadow-sm outline-none transition-colors placeholder:text-text-light focus:border-green-primary focus:ring-2 focus:ring-green-primary/10"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("q");
            router.replace(`${pathname}?${params.toString()}`);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-dark"
          aria-label="Clear search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
