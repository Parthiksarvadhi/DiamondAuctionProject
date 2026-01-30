import api from "./axios";

export const getAdminUsers = () => api.get("/admin/users");

export const createUser = (data: {
  name: string;
  email: string;
  password: string;
}) =>
  api.post("/admin/users", data);

export const softDeleteUser = (id: string) =>
  api.patch(`/admin/users/${id}/soft`);

export const restoreUser = (id: string) =>
  api.patch(`/admin/users/${id}/restore`);

export const hardDeleteUser = (id: string) =>
  api.delete(`/admin/users/${id}/hard`);

export const adjustWallet = (userId: string, amount: number) =>
  api.post(`/admin/wallet/${userId}`, { amount });
