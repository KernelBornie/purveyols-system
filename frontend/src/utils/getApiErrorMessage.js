/**
 * Extract a user-friendly error message from an API error object.
 * @param {any} error - The error from axios catch block.
 * @param {string} fallback - Fallback message if nothing can be extracted.
 * @returns {string}
 */
export default function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  // Axios response error
  const status = error.response?.status;
  const serverMsg =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.msg;

  if (serverMsg && typeof serverMsg === 'string') {
    return serverMsg;
  }

  // Network / offline errors
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return 'Network error – please check your connection.';
  }

  // 401 Unauthorized
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  // 403 Forbidden
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  // 404 Not Found
  if (status === 404) {
    return 'The requested resource was not found.';
  }

  // Fallback to error.message or the fallback param
  return error.message || fallback;
}