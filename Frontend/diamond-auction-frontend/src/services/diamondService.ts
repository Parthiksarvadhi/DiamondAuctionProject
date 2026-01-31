import api from "./configs/apiService";
import appConfig from "./configs/app.config";

export const getDiamonds = (params?: { deleted?: boolean }) =>
  api.get(appConfig.endpoints.diamonds.list, { params });

export const getDiamondById = (id: string) => 
  api.get(appConfig.endpoints.diamonds.details(id));

export const createDiamond = (data: FormData) =>
  api.post(appConfig.endpoints.diamonds.create, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateDiamond = (id: string, data: FormData) =>
  api.put(appConfig.endpoints.diamonds.update(id), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const softDeleteDiamond = (id: string) => 
  api.patch(appConfig.endpoints.diamonds.softDelete(id));

export const restoreDiamond = (id: string) => 
  api.patch(appConfig.endpoints.diamonds.restore(id));

export const hardDeleteDiamond = (id: string) => 
  api.delete(appConfig.endpoints.diamonds.hardDelete(id));