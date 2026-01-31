import api from "./configs/apiService";
import appConfig from "./configs/app.config";

export const getBalance = () => 
  api.get(appConfig.endpoints.wallet.balance);

export const topup = (amount: number) => 
  api.post(appConfig.endpoints.wallet.topup, { amount });

export const getHistory = () => 
  api.get(appConfig.endpoints.wallet.history);