const resourceOrigin = process.env.NEXT_PUBLIC_RESOURCE_ORIGIN?.replace(/\/+$/, "") ?? "";
const resourceAccessToken = process.env.NEXT_PUBLIC_RESOURCE_ACCESS_TOKEN ?? "";

/**
 * Keeps local development on /public/resources while production can serve the
 * same paths through the private S3 redirector.
 */
export function resourceUrl(path: string) {
  if (!resourceOrigin || !path.startsWith("/resources/")) return path;

  const url = new URL(path, `${resourceOrigin}/`);
  if (resourceAccessToken) url.searchParams.set("access", resourceAccessToken);
  return url.href;
}
