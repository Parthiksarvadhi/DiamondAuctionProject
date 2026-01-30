import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/diamonds", label: "Diamonds" },
  { to: "/admin/auctions", label: "Auctions" },
];

export default function AdminSidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="font-bold text-lg bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          Admin Panel
        </h2>
        {/* Admin User Info */}
        {user && (
          <div className="mt-3 p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user.email}
                </div>
                <div className="text-xs text-amber-400 font-medium">
                  Administrator
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 p-2">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left rounded-lg text-slate-300 hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
