import API from './axios';

export async function login(email, password) {
  try {
    const { data } = await API.post('/auth/login', { email, password });
    return data;
  } catch (networkErr) {
    if (!networkErr.response) {
      throw new Error("Unable to reach the server. Please check your connection and try again.");
    }
    throw new Error(
      networkErr.response?.data?.message ||
      networkErr.response?.data?.errors?.[0]?.msg ||
      "Login failed"
    );
  }
}

export async function changePassword(oldPassword, newPassword) {
  try {
    const { data } = await API.put('/auth/change-password', { oldPassword, newPassword });
    return data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
      (err.response?.data?.errors && err.response.data.errors[0]?.msg) ||
      "Failed to change password"
    );
  }
}
