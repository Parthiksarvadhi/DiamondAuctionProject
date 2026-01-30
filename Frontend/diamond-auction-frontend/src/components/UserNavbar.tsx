import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useState, useEffect, useRef } from "react";

const links = [
  { to: "/user", label: "Dashboard" },
  { to: "/user/auctions", label: "Auctions" },
  { to: "/user/wallet", label: "Wallet" },
];

export default function UserNavbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <NavLink to="/user" className="font-bold text-lg bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Diamond Auction
          </NavLink>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/user"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm ${
                  isActive ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {/* User Info */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:bg-slate-800 rounded-lg p-2 transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {user.name || 'User'}
                  </div>
                  {user.email && (
                    <div className="text-xs text-slate-400">
                      {user.email}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="font-medium text-slate-900">{user.name || 'User'}</div>
                    {user.email && (
                      <div className="text-sm text-slate-500">{user.email}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                  
                  <NavLink
                    to="/user"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    🏠 Dashboard
                  </NavLink>
                  
                  <NavLink
                    to="/user/wallet"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    💰 My Wallet
                  </NavLink>
                  
                  <NavLink
                    to="/user/auctions"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    🔨 Browse Auctions
                  </NavLink>
                  
                  <div className="border-t border-slate-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400">Not logged in</div>
          )}
        </div>
      </div>
    </nav>
  );
}
