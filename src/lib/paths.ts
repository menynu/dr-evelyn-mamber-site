import type { Locale } from "./role";
import { clinic } from "./config";

export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const slashed = normalized.endsWith("/") ? normalized : `${normalized}/`;
  if (locale === "he") return slashed;
  if (slashed === "/") return "/en/";
  return `/en${slashed}`;
}

export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function samePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

export function absoluteUrl(path: string): string {
  const base = clinic.siteUrl.replace(/\/$/, "");
  if (path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const clean = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const without = clean.replace(/^\/en(?=\/)/, "") || "/";
  return localePath(target, without);
}
