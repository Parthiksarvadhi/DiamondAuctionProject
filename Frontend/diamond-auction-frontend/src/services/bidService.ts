import api from "./configs/apiService";
import appConfig from "./configs/app.config";

export const getBids = () => 
  api.get(appConfig.endpoints.bids.list);

export const getBidById = (id: string) => 
  api.get(appConfig.endpoints.bids.details(id));

export const getCurrentBid = (id: string) => 
  api.get(appConfig.endpoints.bids.current(id));

export const getBidHistory = (id: string) => 
  api.get(appConfig.endpoints.bids.history(id));

export const getCompletedBids = () => 
  api.get(appConfig.endpoints.bids.completed);

export const createBid = (data: {
  diamond_id: string;
  base_price?: number;
  base_bid_price?: number;
  start_time?: string;
  end_time?: string;
  description?: string;
}) =>
  api.post(appConfig.endpoints.bids.create, {
    ...data,
    base_bid_price: data.base_bid_price ?? data.base_price,
  });

export const startAuction = (id: string) => 
  api.post(appConfig.endpoints.bids.start(id));

export const stopAuction = (id: string) => 
  api.post(appConfig.endpoints.bids.close(id));

export const placeBid = (id: string, amount: number) => 
  api.post(appConfig.endpoints.bids.place(id), { amount });

export const setAutoBid = (id: string, max_amount: number) =>
  api.post(appConfig.endpoints.bids.auto(id), { max_amount });

export const softDeleteBid = (id: string) => 
  api.patch(appConfig.endpoints.bids.softDelete(id));

export const restoreBid = (id: string) => 
  api.patch(appConfig.endpoints.bids.restore(id));

export const hardDeleteBid = (id: string) => 
  api.delete(appConfig.endpoints.bids.hardDelete(id));