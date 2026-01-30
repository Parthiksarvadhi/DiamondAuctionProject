import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as walletApi from "../../api/wallet.api";
import type { WalletTransaction } from "../../types";

interface WalletState {
  balance: number;
  history: WalletTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  history: [],
  loading: false,
  error: null,
};

export const fetchBalance = createAsyncThunk(
  "wallet/balance",
  async (_, thunkAPI) => {
    try {
      const res = await walletApi.getBalance();
      return res.data?.balance ?? res.data?.wallet_balance ?? 0;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const topupWallet = createAsyncThunk(
  "wallet/topup",
  async (amount: number, thunkAPI) => {
    try {
      await walletApi.topup(amount);
      return amount;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const fetchWalletHistory = createAsyncThunk(
  "wallet/history",
  async (_, thunkAPI) => {
    try {
      const res = await walletApi.getHistory();
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = Number(action.payload);
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(topupWallet.fulfilled, (state, action) => {
        state.balance = state.balance + action.payload;
      })
      .addCase(fetchWalletHistory.fulfilled, (state, action) => {
        state.history = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { clearError: clearWalletError } = walletSlice.actions;
export default walletSlice.reducer;
