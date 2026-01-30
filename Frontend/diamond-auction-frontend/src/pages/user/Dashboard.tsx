import { Link } from "react-router-dom";

export default function UserDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Dashboard</h1>
      <p className="text-slate-600 mb-6">Welcome to Diamond Auction. Browse auctions and place bids.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/user/auctions"
          className="block p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow border border-slate-100"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Browse Auctions</h2>
          <p className="text-slate-600 text-sm">View active auctions and place bids.</p>
        </Link>
        <Link
          to="/user/wallet"
          className="block p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow border border-slate-100"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Wallet</h2>
          <p className="text-slate-600 text-sm">Check balance and top up.</p>
        </Link>
      </div>
    </div>
  );
}
