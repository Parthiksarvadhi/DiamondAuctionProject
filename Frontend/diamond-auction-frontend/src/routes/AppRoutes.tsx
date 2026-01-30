import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminRoute from "./AdminRoute";
import UserRoute from "./UserRoute";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminDiamonds from "../pages/admin/Diamonds";
import AdminAuctions from "../pages/admin/Auctions";
import UserDashboard from "../pages/user/Dashboard";
import UserAuctions from "../pages/user/Auctions";
import UserWallet from "../pages/user/Wallet";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="diamonds" element={<AdminDiamonds />} />
            <Route path="auctions" element={<AdminAuctions />} />
          </Route>
        </Route>

        <Route path="/user" element={<UserRoute />}>
          <Route element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="auctions" element={<UserAuctions />} />
            <Route path="wallet" element={<UserWallet />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
