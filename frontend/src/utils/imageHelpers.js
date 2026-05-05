import { API_BASE_URL } from '../constants/api';

/**
 * Convert a photoUrl to the complete image URL
 * Handles both old paths (/uploads/photos/...) and new endpoints
 */
export const getProfilePhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;

  // If it's already a full URL (http/https), return as-is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  // If it's the old path format (/uploads/photos/...), convert to new endpoint
  if (photoUrl.startsWith('/uploads/photos/')) {
    const filename = photoUrl.replace('/uploads/photos/', '');
    const endpoint = `/api/account/profile/photo/download/${filename}`;
    return API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  }

  // If it's already the new endpoint, ensure it has the API base
  if (photoUrl.includes('/api/account/profile/photo/download/')) {
    return API_BASE_URL && !photoUrl.startsWith('http') 
      ? `${API_BASE_URL}${photoUrl}`
      : photoUrl;
  }

  // Fallback with API base URL
  return API_BASE_URL ? `${API_BASE_URL}${photoUrl}` : photoUrl;
};
