import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginApi, validateTokenApi } from "../../api/auth.api";

interface User {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "user";
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

function getStoredUser(): AuthState["user"] {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.id && u?.role) return u;
  } catch {}
  return null;
}

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: getStoredUser(),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, thunkAPI) => {
    try {
      const res = await loginApi(data);
      return res.data;
    } catch (e: any) {
      return thunkAPI.rejectWithValue(e.response?.data?.error || "Login failed");
    }
  }
);

export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      
      // Call API to validate token
      const res = await validateTokenApi();
      const user = res.data.user || getStoredUser();
      
      if (!user) throw new Error("No user found");
      
      return { token, user };
    } catch (e: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return thunkAPI.rejectWithValue("Token validation failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: any) => {
        state.loading = false;
        state.token = action.payload.token;
        const p = action.payload;
        const u = p.user
          ? {
              id: p.user.id,
              name: p.user.name || "",
              email: p.user.email,
              role: (p.user.role || "user") as "admin" | "user",
            }
          : p.id
            ? {
                id: String(p.id),
                name: p.name || "",
                email: p.email || "",
                role: (p.role || "user") as "admin" | "user",
              }
            : null;
        state.user = u;
        if (p.token) localStorage.setItem("token", p.token);
        if (u) localStorage.setItem("user", JSON.stringify(u));
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(validateToken.fulfilled, (state, action: any) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(validateToken.rejected, (state) => {
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;