export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  wallet_balance: number;
  status?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface Diamond {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price?: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BidAuction {
  id: string;
  diamond_id: string;
  diamond?: Diamond;
  diamond_name?: string;
  image_url?: string;
  base_price: number;
  base_bid_price?: number;
  current_price?: number;
  winning_amount?: number;
  status: "draft" | "active" | "closed";
  winner_id?: string | null;
  winner_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  description?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id?: string;
  user_id?: string;
  amount: number;
  type: string;
  reason?: string;
  created_at: string;
}
