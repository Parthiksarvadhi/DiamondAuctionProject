import { useEffect, useState } from "react";
import { toast } from "../../context/ToastContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchBalance, fetchWalletHistory, topupWallet } from "../../store/slices/walletSlice";
import Modal from "../../components/Modal";

export default function UserWallet() {
  const dispatch = useAppDispatch();
  const { balance, history, loading } = useAppSelector((s) => s.wallet);
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");

  useEffect(() => {
    dispatch(fetchBalance());
    dispatch(fetchWalletHistory());
  }, [dispatch]);

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    dispatch(topupWallet(amount))
      .unwrap()
      .then(() => {
        toast.success("Top-up successful");
        setTopupModal(false);
        setTopupAmount("");
        dispatch(fetchBalance());
        dispatch(fetchWalletHistory());
      })
      .catch((e) => toast.error(e));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Wallet</h1>
        <button
          onClick={() => setTopupModal(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-xl"
        >
          Top up
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <p className="text-slate-600 text-sm">Balance</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              ${Number(balance).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <h2 className="px-4 py-3 bg-slate-100 font-medium">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((t, i) => (
                      <tr key={t.id ?? `${t.created_at}-${i}`} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={t.amount >= 0 ? "text-green-600" : "text-red-600"}>
                            {t.amount >= 0 ? "+" : ""}${t.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">{t.type}</td>
                        <td className="px-4 py-3 text-slate-600">{t.reason || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={topupModal} onClose={() => { setTopupModal(false); setTopupAmount(""); }} title="Top up (dummy)">
        <form onSubmit={handleTopup} className="space-y-4">
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Amount"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl"
            required
          />
          <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-xl">
            Top up
          </button>
        </form>
      </Modal>
    </div>
  );
}
