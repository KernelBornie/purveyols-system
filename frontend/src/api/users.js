import API from "./axios";

export async function listUsers() {
  const res = await API.get("/users");
  return res.data;
}

export async function createUser(userData) {
  const res = await API.post("/users", userData);
  return res.data;
}

export async function deleteUser(id) {
  const res = await API.delete(`/users/${id}`);
  return res.data;
}
