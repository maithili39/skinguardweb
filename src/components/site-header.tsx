"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SiteHeaderProps {
  user?: { email: string } | null;
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-green-light font-semibold text-green-dark"
          : "text-text-body hover:bg-bg-section hover:text-green-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export default function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Sign-in link goes back to current page after login
  const signInHref = `/login?next=${encodeURIComponent(pathname)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-header-border bg-header-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="SkinGuard" width={42} height={42} className="rounded-xl" priority />
          <span className="font-display text-2xl font-bold tracking-tight text-text-dark">
            Skin<span className="text-green-primary">Guard</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
          <NavLink href="/analyze">Analyze</NavLink>
          <NavLink href="/ingredients">Ingredients</NavLink>
          <NavLink href="/products">Products</NavLink>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar button */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-primary text-white text-sm font-bold hover:bg-green-btn-hover transition-colors focus:outline-none focus:ring-2 focus:ring-green-primary focus:ring-offset-2"
              >
                {user.email[0].toUpperCase()}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-text-muted">Signed in as</p>
                    <p className="text-sm font-semibold text-text-dark truncate">{user.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="p-2 flex flex-col gap-0.5">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-dark hover:bg-bg-section transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      My Account
                    </Link>
                    <Link
                      href="/analyze"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-dark hover:bg-bg-section transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                      </svg>
                      New Analysis
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-risk-bad hover:bg-risk-bad-bg transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href={signInHref}
                className="hidden text-sm font-medium text-text-body hover:text-green-primary sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-green-btn px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
