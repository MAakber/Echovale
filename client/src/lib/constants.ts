export const API_BASE_URL = "http://localhost:8080";

export const buildAssetUrl = (path: string) => `${API_BASE_URL}${path}`;

export const resolveAssetUrl = (path: string) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/gallery/") || path.startsWith("/placeholders/") || path.startsWith("/uploads/")) {
    return buildAssetUrl(path);
  }

  return path;
};

export const PLACEHOLDERS = {
  RURAL: resolveAssetUrl("/gallery/hongcun.jpg"),
  OLD_PHOTO: resolveAssetUrl("/placeholders/text-letter.svg"),
  AI_RESTORED: resolveAssetUrl("/gallery/hongcun.jpg"),
};
