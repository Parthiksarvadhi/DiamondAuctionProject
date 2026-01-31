import { useEffect, useState, useRef } from "react";
import { toast } from "../../context/ToastContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchDiamonds,
  createDiamond,
  updateDiamondById,
  softDeleteDiamondById,
  restoreDiamondById,
  hardDeleteDiamondById,
} from "../../store/slices/diamondSlice";
import { fetchBids } from "../../store/slices/auctionSlice";
import Modal from "../../components/Modal";
import { getImageUrlWithFallback } from "../../utils/imageUtils";
import type { Diamond } from "../../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function AdminDiamonds() {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((s) => s.diamonds);
  const { list: auctions } = useAppSelector((s) => s.auctions);
  const [showDeleted, setShowDeleted] = useState(false);
  const [editModal, setEditModal] = useState<Diamond | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    dispatch(fetchDiamonds({ deleted: showDeleted }));
    dispatch(fetchBids()); // Fetch auctions to determine diamond status
  }, [dispatch, showDeleted]);

  const displayList = showDeleted ? list.filter((d) => d.is_deleted) : list.filter((d) => !d.is_deleted);

  // Function to get diamond status based on auction data
  const getDiamondStatus = (diamond: Diamond) => {
    if (diamond.is_deleted) {
      return { text: "Deleted", color: "text-red-600", bg: "bg-red-100" };
    }

    // Find auctions for this diamond
    const diamondAuctions = auctions.filter(auction => auction.diamond_id === diamond.id);
    
    if (diamondAuctions.length === 0) {
      return { text: "Available", color: "text-green-600", bg: "bg-green-100" };
    }

    // Check for active auction
    const activeAuction = diamondAuctions.find(auction => auction.status === "active");
    if (activeAuction) {
      return { text: "In Auction", color: "text-amber-600", bg: "bg-amber-100" };
    }

    // Check for draft auction
    const draftAuction = diamondAuctions.find(auction => auction.status === "draft");
    if (draftAuction) {
      return { text: "Scheduled", color: "text-blue-600", bg: "bg-blue-100" };
    }

    // Check for closed auction (sold)
    const closedAuction = diamondAuctions.find(auction => auction.status === "closed");
    if (closedAuction) {
      return { text: "Sold", color: "text-purple-600", bg: "bg-purple-100" };
    }

    return { text: "Available", color: "text-green-600", bg: "bg-green-100" };
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    if (!fd.get("name")) {
      toast.error("Name required");
      return;
    }
    dispatch(createDiamond(fd))
      .unwrap()
      .then(() => {
        toast.success("Diamond created");
        setCreateModal(false);
        form.reset();
        dispatch(fetchDiamonds());
      })
      .catch((err) => toast.error(err));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = editFormRef.current;
    if (!form || !editModal) return;
    const fd = new FormData(form);
    dispatch(updateDiamondById({ id: editModal.id, data: fd }))
      .unwrap()
      .then(() => {
        toast.success("Diamond updated");
        setEditModal(null);
        dispatch(fetchDiamonds());
      })
      .catch((err) => toast.error(err));
  };

  const handleSoftDelete = (id: string) => {
    dispatch(softDeleteDiamondById(id))
      .unwrap()
      .then(() => toast.success("Soft deleted"))
      .catch((e) => toast.error(e));
  };
  const handleRestore = (id: string) => {
    dispatch(restoreDiamondById(id))
      .unwrap()
      .then(() => toast.success("Restored"))
      .catch((e) => toast.error(e));
  };
  const handleHardDelete = (id: string) => {
    if (!confirm("Permanently delete this diamond?")) return;
    dispatch(hardDeleteDiamondById(id))
      .unwrap()
      .then(() => toast.success("Deleted"))
      .catch((e) => toast.error(e));
  };

  const handleCleanupImages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/diamonds/cleanup-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        dispatch(fetchDiamonds());
      } else {
        toast.error(result.error || 'Cleanup failed');
      }
    } catch (error) {
      toast.error('Cleanup failed');
    }
  };

  const handleUpdatePrices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/diamonds/update-prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
        // Refresh auctions data if we're on auctions page
        window.location.reload();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Diamonds</h1>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-600 font-medium">Available</span>
              <span className="text-slate-500">Ready for auction</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">Scheduled</span>
              <span className="text-slate-500">Auction created</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-600 font-medium">In Auction</span>
              <span className="text-slate-500">Currently bidding</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">Sold</span>
              <span className="text-slate-500">Auction completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">Deleted</span>
              <span className="text-slate-500">Soft deleted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Show deleted
          </label>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`${API_BASE}/api/diamonds/create-test-users`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                const result = await response.json();
                if (response.ok) {
                  toast.success(result.message);
                  console.log("Test users:", result.credentials);
                  alert(`Test users created!\nUser 1: ${result.credentials[0].email} / ${result.credentials[0].password}\nUser 2: ${result.credentials[1].email} / ${result.credentials[1].password}`);
                } else {
                  toast.error(result.error || 'Failed to create test users');
                }
              } catch (error) {
                toast.error('Failed to create test users');
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl"
          >
            Create Test Users
          </button>
          <button
            onClick={handleUpdatePrices}
            className="px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            Update Prices
          </button>
          <button
            onClick={handleCleanupImages}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl"
          >
            Cleanup Images
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl"
          >
            Create Diamond
          </button>
        </div>
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
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Base Price</th>
                  <th className="px-4 py-3 font-medium">Status & Auction Info</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {d.image_url ? (
                        <div className="relative w-12 h-12">
                          <img
                            src={getImageUrlWithFallback(d.image_url)}
                            alt={d.name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onLoad={() => {
                              // Image loaded successfully
                            }}
                            onError={(e) => {
                              console.warn(`Image not found for ${d.name}:`, d.image_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 absolute top-0 left-0" style={{display: 'none'}}>
                            💎
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                          💎
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{d.name}</td>
                    <td className="px-4 py-3">
                      {d.base_price ? `$${Number(d.base_price).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const status = getDiamondStatus(d);
                        const diamondAuctions = auctions.filter(auction => auction.diamond_id === d.id);
                        const activeAuction = diamondAuctions.find(auction => auction.status === "active");
                        const draftAuction = diamondAuctions.find(auction => auction.status === "draft");
                        const closedAuction = diamondAuctions.find(auction => auction.status === "closed");
                        
                        return (
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                              {status.text}
                            </span>
                            
                            {/* Show auction details */}
                            {activeAuction && (
                              <div className="text-xs text-slate-600">
                                <div>Current: ${Number(activeAuction.current_price || activeAuction.base_bid_price || 0).toLocaleString()}</div>
                                <div>Ends: {activeAuction.end_time ? new Date(activeAuction.end_time).toLocaleDateString() : 'No end time'}</div>
                              </div>
                            )}
                            
                            {draftAuction && (
                              <div className="text-xs text-slate-600">
                                <div>Base: ${Number(draftAuction.base_bid_price || 0).toLocaleString()}</div>
                                <div>Starts: {draftAuction.start_time ? new Date(draftAuction.start_time).toLocaleDateString() : 'Manual start'}</div>
                              </div>
                            )}
                            
                            {closedAuction && (
                              <div className="text-xs text-slate-600">
                                <div>Sold: ${Number(closedAuction.winning_amount || 0).toLocaleString()}</div>
                                <div>Winner: {closedAuction.winner_name || 'No winner'}</div>
                              </div>
                            )}
                            
                            {diamondAuctions.length === 0 && !d.is_deleted && (
                              <div className="text-xs text-slate-500">
                                Ready for auction
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      {!d.is_deleted && (
                        <>
                          <button
                            onClick={() => setEditModal(d)}
                            className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSoftDelete(d.id)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm"
                          >
                            Soft delete
                          </button>
                        </>
                      )}
                      {d.is_deleted && (
                        <button
                          onClick={() => handleRestore(d.id)}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => handleHardDelete(d.id)}
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

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Diamond">
        <form ref={formRef} onSubmit={handleCreate} className="space-y-4">
          <input name="name" placeholder="Name" required className="w-full px-4 py-2 border rounded-xl" />
          <input name="description" placeholder="Description" className="w-full px-4 py-2 border rounded-xl" />
          <input name="base_price" type="number" placeholder="Base Price" required min="0" step="0.01" className="w-full px-4 py-2 border rounded-xl" />
          <input name="image" type="file" accept="image/*" className="w-full" />
          <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-xl">
            Create
          </button>
        </form>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Diamond">
        {editModal && (
          <form ref={editFormRef} onSubmit={handleUpdate} className="space-y-4">
            <input
              name="name"
              defaultValue={editModal.name}
              placeholder="Name"
              required
              className="w-full px-4 py-2 border rounded-xl"
            />
            <input
              name="description"
              defaultValue={editModal.description || ""}
              placeholder="Description"
              className="w-full px-4 py-2 border rounded-xl"
            />
            <input
              name="base_price"
              type="number"
              defaultValue={editModal.base_price || ""}
              placeholder="Base Price"
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-xl"
            />
            <input name="image" type="file" accept="image/*" className="w-full" />
            <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-xl">
              Update
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
