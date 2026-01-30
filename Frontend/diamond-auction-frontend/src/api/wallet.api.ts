import api from "./axios";

export const getBalance = () => api.get("/wallet/balance");
export const topup = (amount: number) => api.post("/wallet/topup", { amount });
export const getHistory = () => api.get("/wallet/history");
