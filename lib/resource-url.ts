const resourceOrigin = process.env.NEXT_PUBLIC_RESOURCE_ORIGIN?.replace(/\/+$/, "") ?? "";

/**
 * Keeps local development on /public/resources while production can serve the
 * same paths through the server-side resource proxy.
 */
export function resourceUrl(path: string) {
  if (!resourceOrigin || !path.startsWith("/resources/")) return path;

  if (resourceOrigin.startsWith("/")) {
    return `${resourceOrigin}${path.slice("/resources".length)}`;
  }

  const url = new URL(path, `${resourceOrigin}/`);
  return url.href;
}
