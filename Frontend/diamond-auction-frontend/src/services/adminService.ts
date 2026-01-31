import api from "./configs/apiService";
import appConfig from "./configs/app.config";

export const getAdminUsers = () => 
  api.get(appConfig.endpoints.admin.users);

export const createUser = (data: {
  name: string;
  email: string;
  password: string;
}) =>
  api.post(appConfig.endpoints.admin.createUser, data);

export const softDeleteUser = (id: string) =>
  api.patch(appConfig.endpoints.admin.softDeleteUser(id));

export const restoreUser = (id: string) =>
  api.patch(appConfig.endpoints.admin.restoreUser(id));

export const hardDeleteUser = (id: string) =>
  api.delete(appConfig.endpoints.admin.hardDeleteUser(id));

export const adjustWallet = (userId: string, amount: number) =>
  api.post(appConfig.endpoints.admin.adjustWallet(userId), { amount });