import api from "./axios";

export const loginApi = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const validateTokenApi = () =>
  api.get("/auth/validate");

export const logoutApi = () =>
  api.post("/auth/logout");
