import type { Locale } from "./role";
import { clinic } from "./config";

function siteBase(): string {
  const raw = import.meta.env.BASE_URL || "/";
  if (raw === "/") return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function rootedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const slashed = normalized.endsWith("/") ? normalized : `${normalized}/`;
  if (locale === "he") return slashed;
  if (slashed === "/") return "/en/";
  return `/en${slashed}`;
}

export function localePath(locale: Locale, path: string): string {
  const rooted = rootedPath(locale, path);
  const base = siteBase();
  return base ? `${base}${rooted}` : rooted;
}

export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function samePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

export function absoluteUrl(path: string): string {
  const origin = clinic.siteUrl.replace(/\/$/, "");
  const base = siteBase();
  const normalized = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (base && normalized !== "/" && (normalized === base || normalized.startsWith(`${base}/`))) {
    return `${origin}${normalized}`;
  }
  if (normalized === "/") return `${origin}${base}/`;
  return `${origin}${base}${normalized}`;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const base = siteBase();
  let clean = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (base && clean === `${base}/`) clean = "/";
  else if (base && clean.startsWith(`${base}/`)) clean = clean.slice(base.length) || "/";
  const without = clean.replace(/^\/en(?=\/)/, "") || "/";
  return localePath(target, without);
}
