import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as adminApi from "../../services/adminService";
import type { AdminUser } from "../../types";

interface UserState {
  list: AdminUser[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  list: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async (_, thunkAPI) => {
    try {
      const res = await adminApi.getAdminUsers();
      console.log("data"+res)
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch users");
    }
  }
);
export const createUser = createAsyncThunk(
  "users/create",
  async (
    data: { name: string; email: string; password: string },
    thunkAPI
  ) => {
    try {
      const res = await adminApi.createUser(data);
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || "Failed to create user"
      );
    }
  }
);


export const softDeleteUserById = createAsyncThunk(
  "users/softDelete",
  async (id: string, thunkAPI) => {
    try {
      await adminApi.softDeleteUser(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const restoreUserById = createAsyncThunk(
  "users/restore",
  async (id: string, thunkAPI) => {
    try {
      await adminApi.restoreUser(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const hardDeleteUserById = createAsyncThunk(
  "users/hardDelete",
  async (id: string, thunkAPI) => {
    try {
      await adminApi.hardDeleteUser(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

export const adjustUserWallet = createAsyncThunk(
  "users/adjustWallet",
  async ({ userId, amount }: { userId: string; amount: number }, thunkAPI) => {
    try {
      await adminApi.adjustWallet(userId, amount);
      return { userId, amount };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed");
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(softDeleteUserById.fulfilled, (state, action) => {
        const u = state.list.find((x) => x.id === action.payload);
        if (u) u.is_deleted = true;
      })
      .addCase(restoreUserById.fulfilled, (state, action) => {
        const u = state.list.find((x) => x.id === action.payload);
        if (u) u.is_deleted = false;
      })
      .addCase(hardDeleteUserById.fulfilled, (state, action) => {
        state.list = state.list.filter((x) => x.id !== action.payload);
      })
      .addCase(createUser.fulfilled, (state, action) => {
  state.list.unshift(action.payload as any);
})

      .addCase(adjustUserWallet.fulfilled, (state, action) => {
        const u = state.list.find((x) => x.id === action.payload.userId);
        if (u) u.wallet_balance = (u.wallet_balance || 0) + action.payload.amount;
      });
  },
});

export const { clearError: clearUserError } = userSlice.actions;
export default userSlice.reducer;
