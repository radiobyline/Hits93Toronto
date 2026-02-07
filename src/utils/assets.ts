export function resolvePublicAssetUrl(assetPath: string): string {
  const normalizedPath = assetPath.replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL || "/";

  if (base.endsWith("/")) {
    return `${base}${normalizedPath}`;
  }

  return `${base}/${normalizedPath}`;
}
