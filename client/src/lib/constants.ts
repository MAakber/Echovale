export const API_BASE_URL = "http://localhost:8080";

export const buildAssetUrl = (path: string) => `${API_BASE_URL}${path}`;

export const PLACEHOLDERS = {
  RURAL: buildAssetUrl("/gallery/hongcun.jpg"),
  OLD_PHOTO: buildAssetUrl("/placeholders/text-letter.svg"),
  AI_RESTORED: buildAssetUrl("/gallery/hongcun.jpg"),
};
