const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  
  return `${API_BASE}${imageUrl}`;
};

export const checkImageExists = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const getImageUrlWithFallback = (imageUrl: string | null | undefined): string => {
  const url = getImageUrl(imageUrl);
  return url || '';
};