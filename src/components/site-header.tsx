"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SiteHeaderProps {
  user?: { email: string } | null;
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

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
  return (
    <header className="sticky top-0 z-50 border-b border-header-border bg-header-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="SkinGuard"
            width={42}
            height={42}
            className="rounded-xl"
            priority
          />
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
        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <Link
              href="/account"
              className="hidden text-text-body hover:text-green-primary sm:inline"
            >
              My Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden text-text-body hover:text-green-primary sm:inline"
            >
              Sign In
            </Link>
          )}
          {user ? (
            <Link
              href="/account"
              className="rounded-full bg-green-btn px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-btn-hover"
            >
              {user.email.split("@")[0]}
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-full bg-green-btn px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-btn-hover"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
