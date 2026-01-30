import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import diamondReducer from "./slices/diamondSlice";
import auctionReducer from "./slices/auctionSlice";
import walletReducer from "./slices/walletSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    diamonds: diamondReducer,
    auctions: auctionReducer,
    wallet: walletReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
