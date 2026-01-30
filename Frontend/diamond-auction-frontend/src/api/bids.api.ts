import api from "./axios";

export const getBids = () => api.get("/bids");
export const getBidById = (id: string) => api.get(`/bids/${id}`);
export const getCurrentBid = (id: string) => api.get(`/bids/${id}/current`);
export const getBidHistory = (id: string) => api.get(`/bids/${id}/history`);
export const getCompletedBids = () => api.get("/bids/history/completed");
export const createBid = (data: {
  diamond_id: string;
  base_price?: number;
  base_bid_price?: number;
  start_time?: string;
  end_time?: string;
  description?: string;
}) =>
  api.post("/bids", {
    ...data,
    base_bid_price: data.base_bid_price ?? data.base_price,
  });
export const startAuction = (id: string) => api.post(`/bids/${id}/start`);
export const stopAuction = (id: string) => api.post(`/bids/${id}/close`);
export const placeBid = (id: string, amount: number) => api.post(`/bids/${id}/place`, { amount });
export const setAutoBid = (id: string, max_amount: number) =>
  api.post(`/bids/${id}/auto`, { max_amount });
export const softDeleteBid = (id: string) => api.patch(`/bids/${id}/soft`);
export const restoreBid = (id: string) => api.patch(`/bids/${id}/restore`);
export const hardDeleteBid = (id: string) => api.delete(`/bids/${id}/hard`);
