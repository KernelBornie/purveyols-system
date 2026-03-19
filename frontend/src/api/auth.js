export async function login(email, password) {

  let res;
  try {
    res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });
  } catch (networkErr) {
    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }

  let data;
  try {
    data = await res.json();
  } catch (jsonErr) {
    throw new Error("Server returned an unexpected response. Please try again later.");
  }

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function changePassword(oldPassword, newPassword) {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/auth/change-password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || (data.errors && data.errors[0]?.msg) || "Failed to change password");
  return data;
}
