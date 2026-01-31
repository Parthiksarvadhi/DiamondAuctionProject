import { useEffect, useState, useRef } from "react";
import { toast } from "../../context/ToastContext";
import { useSocket } from "../../context/SocketContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchBids,
  fetchCompletedBids,
  createBid,
  startAuctionById,
  stopAuctionById,
  softDeleteAuction,
  hardDeleteAuction,
  updateBidLive,
  setAuctionClosed,
  setAuctionActive,
} from "../../store/slices/auctionSlice";
import { fetchDiamonds as fetchDiamondsList } from "../../store/slices/diamondSlice";
import { getBidHistory } from "../../services/bidService";
import Modal from "../../components/Modal";
import type { BidAuction } from "../../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

// Utility function to get current price
const getCurrentPrice = (auction: BidAuction): number => {
  // Priority: current_price > base_bid_price > base_price > 0
  const current = auction.current_price ?? auction.base_bid_price ?? auction.base_price ?? 0;
  const result = Number(current) || 0;
  console.log("Admin getCurrentPrice for auction", auction.id, ":", {
    current_price: auction.current_price,
    base_bid_price: auction.base_bid_price,
    base_price: auction.base_price,
    result
  });
  return result;
};

interface BidHistoryItem {
  current_amount: number;
  created_at: string;
  bidder_name: string;
  bidder_email: string;
  bidder_role: string;
  bidder_wallet: number;
  user_id: string;
  is_winner: boolean;
  history: any;
}

export default function AdminAuctions() {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const { list, completed, loading } = useAppSelector((s) => s.auctions);
  const { list: diamonds } = useAppSelector((s) => s.diamonds);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<BidAuction | null>(null);
  const [deleteModal, setDeleteModal] = useState<BidAuction | null>(null);
  const [historyModal, setHistoryModal] = useState<{ auction: BidAuction; history: BidHistoryItem[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [createDiamondId, setCreateDiamondId] = useState("");
  const [createBasePrice, setCreateBasePrice] = useState("");
  const [createStartTime, setCreateStartTime] = useState("");
  const [createEndTime, setCreateEndTime] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  
  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    dispatch(fetchBids());
    dispatch(fetchCompletedBids());
    dispatch(fetchDiamondsList());
  }, [dispatch]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleNewBid = (data: { bidId: string; highest_bidder: string; amount: number }) => {
      dispatch(updateBidLive({ 
        bidId: data.bidId, 
        current_price: data.amount 
      }));

      // Refresh bid history if modal is open for this auction
      if (historyModal && historyModal.auction.id === data.bidId) {
        handleShowHistory(historyModal.auction);
      }
    };

    const handleAuctionClosed = (data: { bidId: string; winner: any }) => {
      dispatch(setAuctionClosed(data.bidId));
      dispatch(fetchBids());
      dispatch(fetchCompletedBids());
    };

    const handleAuctionStarted = (data: { auctionId: string; message: string }) => {
      console.log("Auction started:", data);
      toast.success(`Auction started: ${data.message}`);
      dispatch(setAuctionActive(data.auctionId));
      dispatch(fetchBids());
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new-bid", handleNewBid);
    socket.on("auction-closed", handleAuctionClosed);
    socket.on("auction-started", handleAuctionStarted);

    // Set initial connection status
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new-bid", handleNewBid);
      socket.off("auction-closed", handleAuctionClosed);
      socket.off("auction-started", handleAuctionStarted);
    };
  }, [socket, dispatch]);

  const activeDiamonds = diamonds.filter((d) => !d.is_deleted);
  const usedDiamondIds = new Set(list.map((b) => b.diamond_id));
  const availableDiamonds = activeDiamonds.filter((d) => !usedDiamondIds.has(d.id));

  // Get minimum datetime for start_time (current time)
  const getMinStartTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  // Get minimum datetime for end_time (current time + 1 hour)
  const getMinEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDiamondId || !createBasePrice || !createEndTime) {
      toast.error("Please fill all required fields");
      return;
    }

    const base_price = Number(createBasePrice);
    if (Number.isNaN(base_price) || base_price <= 0) {
      toast.error("Invalid base price");
      return;
    }

    const endTime = new Date(createEndTime);
    if (endTime <= new Date()) {
      toast.error("End time must be in the future");
      return;
    }

    // Validate start time if provided
    if (createStartTime) {
      const startTime = new Date(createStartTime);
      if (startTime <= new Date()) {
        toast.error("Start time must be in the future");
        return;
      }
      if (startTime >= endTime) {
        toast.error("Start time must be before end time");
        return;
      }
    }

    const auctionData = {
      diamond_id: createDiamondId,
      base_price,
      base_bid_price: base_price,
      start_time: createStartTime || undefined,
      end_time: createEndTime,
      description: createDescription || undefined,
    };

    dispatch(createBid(auctionData))
      .unwrap()
      .then(() => {
        toast.success("Auction created");
        setCreateModal(false);
        resetCreateForm();
        dispatch(fetchBids());
      })
      .catch((e) => toast.error(e));
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    const form = editFormRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const base_price = Number(formData.get("base_price"));
    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;

    if (Number.isNaN(base_price) || base_price <= 0) {
      toast.error("Invalid base price");
      return;
    }

    if (new Date(end_time) <= new Date()) {
      toast.error("End time must be in the future");
      return;
    }

    // Validate start time if provided
    if (start_time) {
      const startTime = new Date(start_time);
      if (startTime <= new Date()) {
        toast.error("Start time must be in the future");
        return;
      }
      if (startTime >= new Date(end_time)) {
        toast.error("Start time must be before end time");
        return;
      }
    }

    // You'll need to add updateAuctionById to your slice
    // For now, we'll show a message
    toast.error("Edit functionality needs to be implemented in the backend");
    setEditModal(null);
  };

  const resetCreateForm = () => {
    setCreateDiamondId("");
    setCreateBasePrice("");
    setCreateStartTime("");
    setCreateEndTime("");
    setCreateDescription("");
  };

  const handleStart = (id: string) => {
    dispatch(startAuctionById(id))
      .unwrap()
      .then(() => toast.success("Auction started"))
      .catch((e) => toast.error(e));
  };

  const handleStop = (id: string) => {
    dispatch(stopAuctionById(id))
      .unwrap()
      .then(() => {
        toast.success("Auction stopped");
        dispatch(fetchBids());
        dispatch(fetchCompletedBids());
      })
      .catch((e) => toast.error(e));
  };

  const handleSoftDelete = (id: string) => {
    dispatch(softDeleteAuction(id))
      .unwrap()
      .then(() => {
        toast.success("Auction deleted");
        setDeleteModal(null);
      })
      .catch((e) => toast.error(e));
  };

  const handleHardDelete = (id: string) => {
    dispatch(hardDeleteAuction(id))
      .unwrap()
      .then(() => {
        toast.success("Auction permanently deleted");
        setDeleteModal(null);
      })
      .catch((e) => toast.error(e));
  };

  const handleShowHistory = async (auction: BidAuction) => {
    setLoadingHistory(true);
    try {
      const response = await getBidHistory(auction.id);
      console.log("Admin bid history response:", response.data);
      
      // Parse history field if it's a string
      const processedHistory = (response.data as any).bid_history?.map((bid: any) => {
        try {
          return {
            ...bid,
            history: typeof bid.history === 'string' ? JSON.parse(bid.history) : bid.history
          };
        } catch (e) {
          console.warn("Failed to parse bid history JSON:", bid.history, e);
          return {
            ...bid,
            history: [] // fallback to empty array if parsing fails
          };
        }
      }) || [];
      
      console.log("Admin processed history:", processedHistory);
      
      setHistoryModal({
        auction,
        history: processedHistory
      });
    } catch (error) {
      toast.error("Failed to load bid history");
      console.error("Failed to load bid history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Manage Auctions</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              socketConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {socketConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch(`${API_BASE}/api/diamonds/test-cron`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                const result = await response.json();
                if (response.ok) {
                  toast.success(result.message);
                  console.log("Cron test result:", result);
                } else {
                  toast.error(result.error || 'Test failed');
                }
              } catch (error) {
                toast.error('Test failed');
              }
            }}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
          >
            Test Cron
          </button>
          <button
            onClick={async () => {
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
                  dispatch(fetchBids());
                } else {
                  toast.error(result.error || 'Update failed');
                }
              } catch (error) {
                toast.error('Update failed');
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
          >
            Fix Prices
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl"
          >
            Create Auction
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">
            <h2 className="px-4 py-3 bg-slate-100 font-medium">All Auctions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Diamond</th>
                    <th className="px-4 py-3 font-medium">Base / Current</th>
                    <th className="px-4 py-3 font-medium">Start Time</th>
                    <th className="px-4 py-3 font-medium">End Time</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                    <th className="px-4 py-3 font-medium">History</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {(b.diamond?.image_url ?? b.image_url) ? (
                            <div className="relative">
                              <img
                                src={
                                  ((b.diamond?.image_url ?? b.image_url) || "").startsWith("http")
                                    ? (b.diamond?.image_url ?? b.image_url)!
                                    : `${API_BASE}${b.diamond?.image_url ?? b.image_url}`
                                }
                                alt={b.diamond?.name ?? b.diamond_name ?? ""}
                                className="w-12 h-12 object-cover rounded-lg mr-3"
                                onLoad={() => {
                                  // Image loaded successfully
                                }}
                                onError={(e) => {
                                  const imgUrl = ((b.diamond?.image_url ?? b.image_url) || "").startsWith("http")
                                    ? (b.diamond?.image_url ?? b.image_url)!
                                    : `${API_BASE}${b.diamond?.image_url ?? b.image_url}`;
                                  console.error("Image failed to load:", imgUrl);
                                  console.error("Original image_url:", b.diamond?.image_url ?? b.image_url);
                                  console.error("API_BASE:", API_BASE);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-12 h-12 bg-slate-200 rounded-lg mr-3 items-center justify-center text-xs text-slate-500 absolute top-0 left-0" style={{display: 'none'}}>
                                💎
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-lg mr-3 flex items-center justify-center text-xs text-slate-500">
                              💎
                            </div>
                          )}
                          <span>{b.diamond?.name ?? b.diamond_name ?? b.diamond_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        ${Number(b.base_bid_price ?? b.base_price).toLocaleString()} / 
                        ${getCurrentPrice(b).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(b.start_time)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(b.end_time)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            b.status === "active"
                              ? "text-green-600"
                              : b.status === "closed"
                              ? "text-slate-600"
                              : "text-amber-600"
                          }
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {b.status === "draft" && (
                            <>
                              <button
                                onClick={() => setEditModal(b)}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleStart(b.id)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm"
                              >
                                Start
                              </button>
                            </>
                          )}
                          {b.status === "active" && (
                            <button
                              onClick={() => handleStop(b.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm"
                            >
                              Stop
                            </button>
                          )}
                          {b.status === "closed" && (
                            <div className="text-sm text-slate-600">
                              <div>Winner: {b.winner_name || "No winner"}</div>
                              <div>Sold: ${(b.winning_amount ?? 0).toLocaleString()}</div>
                            </div>
                          )}
                          <button
                            onClick={() => setDeleteModal(b)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleShowHistory(b)}
                          disabled={loadingHistory}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 disabled:opacity-50"
                        >
                          {loadingHistory ? "Loading..." : "View History"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <h2 className="px-4 py-3 bg-slate-100 font-medium">Completed (History)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Diamond</th>
                    <th className="px-4 py-3 font-medium">Winning Amount</th>
                    <th className="px-4 py-3 font-medium">Winner</th>
                    <th className="px-4 py-3 font-medium">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        {b.diamond?.name ?? b.diamond_name ?? b.diamond_id}
                      </td>
                      <td className="px-4 py-3">
                        ${Number(b.winning_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{b.winner_name || "No winner"}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(b.end_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create Auction Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Auction">
        <form ref={createFormRef} onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Diamond *
            </label>
            <select
              value={createDiamondId}
              onChange={(e) => setCreateDiamondId(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
              required
            >
              <option value="">Select diamond</option>
              {availableDiamonds.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.base_price ? `($${d.base_price})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base Price *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={createBasePrice}
              onChange={(e) => setCreateBasePrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
              placeholder="Enter starting bid amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={createStartTime}
              onChange={(e) => setCreateStartTime(e.target.value)}
              min={getMinStartTime()}
              className="w-full px-4 py-2 border rounded-xl"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave empty to start manually, or set a future time for scheduled start
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              value={createEndTime}
              onChange={(e) => setCreateEndTime(e.target.value)}
              min={getMinEndTime()}
              className="w-full px-4 py-2 border rounded-xl"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Auction will automatically end at this time
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl"
              rows={3}
              placeholder="Additional auction details..."
            />
          </div>

          <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-xl">
            Create Auction
          </button>
        </form>
      </Modal>

      {/* Edit Auction Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Auction">
        {editModal && (
          <form ref={editFormRef} onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Diamond
              </label>
              <input
                type="text"
                value={editModal.diamond?.name ?? editModal.diamond_name ?? editModal.diamond_id}
                className="w-full px-4 py-2 border rounded-xl bg-slate-50"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">Diamond cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Price *
              </label>
              <input
                name="base_price"
                type="number"
                min="1"
                step="0.01"
                defaultValue={editModal.base_bid_price ?? editModal.base_price}
                className="w-full px-4 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Time (Optional)
              </label>
              <input
                name="start_time"
                type="datetime-local"
                defaultValue={editModal.start_time ? new Date(editModal.start_time).toISOString().slice(0, 16) : ''}
                min={getMinStartTime()}
                className="w-full px-4 py-2 border rounded-xl"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty to start manually, or set a future time for scheduled start
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Time *
              </label>
              <input
                name="end_time"
                type="datetime-local"
                defaultValue={editModal.end_time ? new Date(editModal.end_time).toISOString().slice(0, 16) : ''}
                min={getMinEndTime()}
                className="w-full px-4 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                defaultValue={editModal.description || ""}
                className="w-full px-4 py-2 border rounded-xl"
                rows={3}
                placeholder="Additional auction details..."
              />
            </div>

            <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-xl">
              Update Auction
            </button>
          </form>
        )}
      </Modal>

      {/* Delete Auction Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Auction">
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete the auction for "{deleteModal.diamond?.name ?? deleteModal.diamond_name ?? deleteModal.diamond_id}"?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSoftDelete(deleteModal.id)}
                className="flex-1 bg-amber-600 text-white py-2 rounded-xl"
              >
                Soft Delete
              </button>
              <button
                onClick={() => handleHardDelete(deleteModal.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl"
              >
                Hard Delete
              </button>
            </div>
            <button
              onClick={() => setDeleteModal(null)}
              className="w-full bg-slate-200 text-slate-700 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>

      {/* Bid History Modal */}
      <Modal 
        open={!!historyModal} 
        onClose={() => setHistoryModal(null)} 
        title={`Bid History - ${historyModal?.auction.diamond?.name ?? historyModal?.auction.diamond_name ?? 'Diamond'}`}
      >
        {historyModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Auction Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  historyModal.auction.status === 'active' ? 'bg-green-100 text-green-800' :
                  historyModal.auction.status === 'closed' ? 'bg-slate-100 text-slate-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {historyModal.auction.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Current Price:</span>
                <span className="text-lg font-bold text-amber-600">
                  ${getCurrentPrice(historyModal.auction).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-medium">Total Bids:</span>
                <span className="font-semibold">{historyModal.history.length}</span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {historyModal.history.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No bids placed yet</p>
                  <p className="text-sm">Waiting for first bid...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600 mb-3">
                    Showing {historyModal.history.length} bid{historyModal.history.length !== 1 ? 's' : ''} (highest to lowest)
                  </div>
                  {historyModal.history.map((bid, index) => (
                    <div 
                      key={`${bid.user_id}-${bid.created_at}`}
                      className={`p-3 rounded-lg border ${
                        index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                      } ${bid.is_winner ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {bid.bidder_name}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({bid.bidder_email})
                            </span>
                            {bid.bidder_role === 'admin' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Admin
                              </span>
                            )}
                            {index === 0 && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Highest Bid
                              </span>
                            )}
                            {bid.is_winner && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Winner 🏆
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            <div>{new Date(bid.created_at).toLocaleString()}</div>
                            <div className="text-xs mt-1">
                              ID: {bid.user_id.slice(0, 8)}... • 
                              Wallet: ${Number(bid.bidder_wallet).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-800">
                            ${Number(bid.current_amount).toLocaleString()}
                          </div>
                          {bid.history && Array.isArray(bid.history) && bid.history.length > 0 && (
                            <div className="text-xs text-slate-500">
                              {bid.history[0].type === 'auto' ? '🤖 Auto Bid' : '👤 Manual Bid'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex gap-2">
              <button
                onClick={() => {
                  if (historyModal) {
                    handleShowHistory(historyModal.auction);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setHistoryModal(null)}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}