import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function UserRoute() {
 const { user } = useAppSelector(s => s.auth);

 if (!user || user.role !== "user") return <Navigate to="/" />;

 return <Outlet />;
}
