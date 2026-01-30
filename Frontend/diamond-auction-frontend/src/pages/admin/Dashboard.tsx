import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchUsers } from "../../store/slices/userSlice";
import { fetchDiamonds } from "../../store/slices/diamondSlice";
import { fetchBids, fetchCompletedBids } from "../../store/slices/auctionSlice";

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { list: users } = useAppSelector((s) => s.users);
  const { list: diamonds } = useAppSelector((s) => s.diamonds);
  const { list: bids, completed } = useAppSelector((s) => s.auctions);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDiamonds());
    dispatch(fetchBids());
    dispatch(fetchCompletedBids());
  }, [dispatch]);

  const revenue = completed.reduce(
    (sum, b) => sum + (Number(b.winning_amount) || 0),
    0
  );

  const cards = [
    { label: "Total Users", value: users.length, color: "from-blue-500 to-blue-600" },
    { label: "Total Diamonds", value: diamonds.length, color: "from-emerald-500 to-emerald-600" },
    { label: "Total Auctions", value: bids.length, color: "from-amber-500 to-amber-600" },
    { label: "Revenue", value: `$${revenue.toLocaleString()}`, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, color }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${color} text-white rounded-2xl p-6 shadow-lg`}
          >
            <p className="text-white/90 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
