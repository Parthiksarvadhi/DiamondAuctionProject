import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as diamondsApi from "../../services/diamondService";
import type { Diamond } from "../../types";

interface DiamondState {
  list: Diamond[];
  loading: boolean;
  error: string | null;
}

const initialState: DiamondState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchDiamonds = createAsyncThunk(
  "diamonds/fetch",
  async (params: { deleted?: boolean } | undefined, thunkAPI) => {
    try {
      const res = await diamondsApi.getDiamonds(params);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const createDiamond = createAsyncThunk(
  "diamonds/create",
  async (data: FormData, thunkAPI) => {
    try {
      const res = await diamondsApi.createDiamond(data);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const updateDiamondById = createAsyncThunk(
  "diamonds/update",
  async ({ id, data }: { id: string; data: FormData }, thunkAPI) => {
    try {
      const res = await diamondsApi.updateDiamond(id, data);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const softDeleteDiamondById = createAsyncThunk(
  "diamonds/softDelete",
  async (id: string, thunkAPI) => {
    try {
      await diamondsApi.softDeleteDiamond(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const restoreDiamondById = createAsyncThunk(
  "diamonds/restore",
  async (id: string, thunkAPI) => {
    try {
      await diamondsApi.restoreDiamond(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const hardDeleteDiamondById = createAsyncThunk(
  "diamonds/hardDelete",
  async (id: string, thunkAPI) => {
    try {
      await diamondsApi.hardDeleteDiamond(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

const diamondSlice = createSlice({
  name: "diamonds",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setBidUpdate() {
      // Used by socket to update a diamond's auction data if needed
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiamonds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiamonds.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDiamonds.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(createDiamond.fulfilled, (state, action) => {
        if (action.payload) state.list.push(action.payload as any);
      })
      .addCase(updateDiamondById.fulfilled, (state, action) => {
        const i = state.list.findIndex((d) => d.id === (action.payload as any)?.id);
        if (i !== -1 && action.payload) state.list[i] = action.payload as any;
      })
      .addCase(softDeleteDiamondById.fulfilled, (state, action) => {
        const d = state.list.find((x) => x.id === action.payload);
        if (d) d.is_deleted = true;
      })
      .addCase(restoreDiamondById.fulfilled, (state, action) => {
        const d = state.list.find((x) => x.id === action.payload);
        if (d) d.is_deleted = false;
      })
      .addCase(hardDeleteDiamondById.fulfilled, (state, action) => {
        state.list = state.list.filter((x) => x.id !== action.payload);
      });
  },
});

export const { clearError: clearDiamondError } = diamondSlice.actions;
export default diamondSlice.reducer;
