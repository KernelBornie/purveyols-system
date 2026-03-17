export async function login(email, password) {

  let res;
  try {
    res = await fetch("/api/auth/login", {
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