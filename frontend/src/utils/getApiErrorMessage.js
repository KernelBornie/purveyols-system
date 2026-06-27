export default function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;
  const status = error.response?.status;
  const serverMsg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.msg;
  if (serverMsg && typeof serverMsg === 'string') return serverMsg;
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') return 'Network error – please check your connection.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  return error.message || fallback;
}
