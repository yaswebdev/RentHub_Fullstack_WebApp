import apiClient from './client';

const ENDPOINT_PHOTO = '/api/account/profile/photo';
const ENDPOINT_PASSWORD = '/api/account/profile/password';
const ENDPOINT_NAME = '/api/account/profile/name';

export async function uploadProfilePhoto(formData) {
  // Let Axios/browser set the Content-Type (with boundary) for FormData
  const { data } = await apiClient.post(ENDPOINT_PHOTO, formData);
  return data; // Expecting updated UserDTO
}

export async function changePassword(currentPassword, newPassword) {
  await apiClient.post(ENDPOINT_PASSWORD, { currentPassword, newPassword });
}

export async function updateProfileName(nom) {
  const { data } = await apiClient.post(ENDPOINT_NAME, { nom });
  return data; // Expecting updated UserDTO
}

export default {
  uploadProfilePhoto,
  changePassword,
  updateProfileName,
};
