import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function AdminRoute() {
 const { user } = useAppSelector(s => s.auth);

 if (!user || user.role !== "admin") return <Navigate to="/" />;

 return <Outlet />;
}
