import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as bidsApi from "../../services/bidService";
import type { BidAuction } from "../../types";

interface AuctionState {
  list: BidAuction[];
  completed: BidAuction[];
  loading: boolean;
  error: string | null;
}

const initialState: AuctionState = {
  list: [],
  completed: [],
  loading: false,
  error: null,
};

export const fetchBids = createAsyncThunk(
  "auctions/fetch",
  async (_, thunkAPI) => {
    try {
      const res = await bidsApi.getBids();
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const fetchCompletedBids = createAsyncThunk(
  "auctions/fetchCompleted",
  async (_, thunkAPI) => {
    try {
      const res = await bidsApi.getCompletedBids();
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const createBid = createAsyncThunk(
  "auctions/create",
  async (
    data: { 
      diamond_id: string; 
      base_price: number; 
      base_bid_price?: number; 
      start_time?: string;
      end_time?: string;
      description?: string;
    },
    thunkAPI
  ) => {
    try {
      const res = await bidsApi.createBid({
        ...data,
        base_bid_price: data.base_bid_price ?? data.base_price,
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const startAuctionById = createAsyncThunk(
  "auctions/start",
  async (id: string, thunkAPI) => {
    try {
      const res = await bidsApi.startAuction(id);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const stopAuctionById = createAsyncThunk(
  "auctions/stop",
  async (id: string, thunkAPI) => {
    try {
      const res = await bidsApi.stopAuction(id);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const placeBidOnAuction = createAsyncThunk(
  "auctions/placeBid",
  async ({ id, amount }: { id: string; amount: number }, thunkAPI) => {
    try {
      const res = await bidsApi.placeBid(id, amount);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const setAutoBidOnAuction = createAsyncThunk(
  "auctions/setAutoBid",
  async ({ id, max_amount }: { id: string; max_amount: number }, thunkAPI) => {
    try {
      const res = await bidsApi.setAutoBid(id, max_amount);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const softDeleteAuction = createAsyncThunk(
  "auctions/softDelete",
  async (id: string, thunkAPI) => {
    try {
      const res = await bidsApi.softDeleteBid(id);
      return { id, ...(res.data as any) };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const restoreAuction = createAsyncThunk(
  "auctions/restore",
  async (id: string, thunkAPI) => {
    try {
      const res = await bidsApi.restoreBid(id);
      return { id, ...(res.data as any) };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const hardDeleteAuction = createAsyncThunk(
  "auctions/hardDelete",
  async (id: string, thunkAPI) => {
    try {
      const res = await bidsApi.hardDeleteBid(id);
      return { id, ...(res.data as any) };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

const auctionSlice = createSlice({
  name: "auctions",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    updateBidLive(state, action) {
      const { bidId, current_price, winning_amount, status, winner_id } = action.payload;
      const b = state.list.find((x) => x.id === bidId);
      if (b) {
        if (current_price != null) b.current_price = current_price;
        if (winning_amount != null) b.winning_amount = winning_amount;
        if (status != null) b.status = status as "draft" | "active" | "closed";
        if (winner_id != null) b.winner_id = winner_id;
      }
    },
    setAuctionClosed(state, action) {
      const bidId = action.payload;
      const b = state.list.find((x) => x.id === bidId);
      if (b) b.status = "closed";
    },
    setAuctionActive(state, action) {
      const bidId = action.payload;
      const b = state.list.find((x) => x.id === bidId);
      if (b) b.status = "active";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBids.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBids.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(fetchCompletedBids.fulfilled, (state, action) => {
        state.completed = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(createBid.fulfilled, (state, action) => {
        if (action.payload) state.list.push(action.payload as any);
      })
      .addCase(startAuctionById.fulfilled, (state, action) => {
        const b = state.list.find((x) => x.id === (action.payload as any)?.id);
        if (b) b.status = "active";
      })
      .addCase(stopAuctionById.fulfilled, (state, action) => {
        const b = state.list.find((x) => x.id === (action.payload as any)?.id);
        if (b) b.status = "closed";
      })
      .addCase(placeBidOnAuction.fulfilled, (state, action) => {
        const updated = action.payload as any;
        if (updated) {
          const i = state.list.findIndex((x) => x.id === updated.id);
          if (i !== -1) state.list[i] = { ...state.list[i], ...updated };
        }
      })
      .addCase(setAutoBidOnAuction.fulfilled, () => {})
      .addCase(softDeleteAuction.fulfilled, (state, action) => {
        const index = state.list.findIndex((x) => x.id === action.payload.id);
        if (index !== -1) {
          state.list.splice(index, 1);
        }
      })
      .addCase(restoreAuction.fulfilled, () => {
        // Refresh the list after restore
      })
      .addCase(hardDeleteAuction.fulfilled, (state, action) => {
        const index = state.list.findIndex((x) => x.id === action.payload.id);
        if (index !== -1) {
          state.list.splice(index, 1);
        }
      });
  },
});

export const { clearError: clearAuctionError, updateBidLive, setAuctionClosed, setAuctionActive } = auctionSlice.actions;
export default auctionSlice.reducer;
