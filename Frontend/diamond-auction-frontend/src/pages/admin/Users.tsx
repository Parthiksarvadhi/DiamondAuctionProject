import { useEffect, useState } from "react";
import { toast } from "../../context/ToastContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createUser } from "../../store/slices/userSlice";

import {
  fetchUsers,
  softDeleteUserById,
  restoreUserById,
  hardDeleteUserById,
  adjustUserWallet,
} from "../../store/slices/userSlice";
import Modal from "../../components/Modal";
import type { AdminUser } from "../../types";

export default function AdminUsers() {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((s) => s.users);
  const [walletModal, setWalletModal] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
const [createModal, setCreateModal] = useState(false);
const [newUser, setNewUser] = useState({
  name: "",
  email: "",
  password: "",
});

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const displayList = showDeleted
    ? list
    : list.filter((u) => !u.is_deleted);

  const handleSoftDelete = (id: string) => {
    dispatch(softDeleteUserById(id))
      .unwrap()
      .then(() => toast.success("User soft deleted"))
      .catch((e) => toast.error(e));
  };
  const handleCreateUser = () => {
  if (!newUser.name || !newUser.email || !newUser.password) {
    toast.error("Fill all fields");
    return;
  }

  dispatch(createUser(newUser))
    .unwrap()
    .then(() => {
      toast.success("User created");
      setCreateModal(false);
      setNewUser({ name: "", email: "", password: "" });
    })
    .catch((e) => toast.error(e));
};

  const handleRestore = (id: string) => {
    dispatch(restoreUserById(id))
      .unwrap()
      .then(() => toast.success("User restored"))
      .catch((e) => toast.error(e));
  };
  const handleHardDelete = (id: string) => {
    if (!confirm("Permanently delete this user?")) return;
    dispatch(hardDeleteUserById(id))
      .unwrap()
      .then(() => toast.success("User deleted"))
      .catch((e) => toast.error(e));
  };
  const handleAdjustWallet = () => {
    if (!walletModal || !adjustAmount) return;
    const amount = Number(adjustAmount);
    if (Number.isNaN(amount)) {
      toast.error("Enter a valid amount");
      return;
    }
    dispatch(adjustUserWallet({ userId: walletModal.id, amount }))
      .unwrap()
      .then(() => {
        toast.success("Wallet updated");
        setWalletModal(null);
        setAdjustAmount("");
      })
      .catch((e) => toast.error(e));
  };
console.log("Current Display List:", displayList)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-slate-800">Manage Users</h1>

  <div className="flex gap-3">
    <button
      onClick={() => setCreateModal(true)}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
    >
      + Add User
    </button>

    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={showDeleted}
        onChange={(e) => setShowDeleted(e.target.checked)}
      />
      Show deleted
    </label>
  </div>
</div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Show deleted
        </label>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                 
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((u) => (
                  
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.is_deleted ? (
                        <span className="text-red-600">Deleted</span>
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      {!u.is_deleted && (
                        <>
                          <button
                            onClick={() => setWalletModal(u)}
                            className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm"
                          >
                            Adjust wallet
                          </button>
                          <button
                            onClick={() => handleSoftDelete(u.id)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm"
                          >
                            Soft delete
                          </button>
                        </>
                      )}
                      {u.is_deleted && (
                        <button
                          onClick={() => handleRestore(u.id)}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => handleHardDelete(u.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                      >
                        Hard delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!walletModal}
        onClose={() => { setWalletModal(null); setAdjustAmount(""); }}
        title="Adjust Wallet"
      >
        {walletModal && (
          <div className="space-y-4">
            <p className="text-slate-600">{walletModal.name} — {walletModal.email}</p>
            <p>Current: ${Number(walletModal.wallet_balance || 0).toLocaleString()}</p>
            <input
              type="number"
              placeholder="Amount (+ or -)"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
            />
            <button
              onClick={handleAdjustWallet}
              className="w-full bg-amber-600 text-white py-2 rounded-xl"
            >
              Update
            </button>
          </div>
        )}
      </Modal>
      <Modal
  open={createModal}
  onClose={() => setCreateModal(false)}
  title="Create User"
>
  <div className="space-y-4">
    <input
      placeholder="Name"
      value={newUser.name}
      onChange={(e) =>
        setNewUser({ ...newUser, name: e.target.value })
      }
      className="w-full px-4 py-2 border rounded-xl"
    />

    <input
      placeholder="Email"
      value={newUser.email}
      onChange={(e) =>
        setNewUser({ ...newUser, email: e.target.value })
      }
      className="w-full px-4 py-2 border rounded-xl"
    />

    <input
      type="password"
      placeholder="Password"
      value={newUser.password}
      onChange={(e) =>
        setNewUser({ ...newUser, password: e.target.value })
      }
      className="w-full px-4 py-2 border rounded-xl"
    />

    <button
      onClick={handleCreateUser}
      className="w-full bg-blue-600 text-white py-2 rounded-xl"
    >
      Create
    </button>
  </div>
</Modal>

    </div>
  );
}
