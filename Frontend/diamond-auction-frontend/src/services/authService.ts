import api from "./configs/apiService";
import appConfig from "./configs/app.config";

export const loginApi = (data: { email: string; password: string }) =>
  api.post(appConfig.endpoints.auth.login, data);

export const validateTokenApi = () =>
  api.get(appConfig.endpoints.auth.validateToken);

export const logoutApi = () =>
  api.post(appConfig.endpoints.auth.refreshToken, {});