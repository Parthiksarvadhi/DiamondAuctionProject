import api from "./axios";

export const getDiamonds = (params?: { deleted?: boolean }) =>
  api.get("/diamonds", { params });
export const getDiamondById = (id: string) => api.get(`/diamonds/${id}`);
export const createDiamond = (data: FormData) =>
  api.post("/diamonds", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateDiamond = (id: string, data: FormData) =>
  api.put(`/diamonds/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const softDeleteDiamond = (id: string) => api.patch(`/diamonds/${id}/soft`);
export const restoreDiamond = (id: string) => api.patch(`/diamonds/${id}/restore`);
export const hardDeleteDiamond = (id: string) => api.delete(`/diamonds/${id}/hard`);
