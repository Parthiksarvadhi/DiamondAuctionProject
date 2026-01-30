import { useEffect, useState } from "react";
import { toast } from "../../context/ToastContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useSocket } from "../../context/SocketContext";
import {
  fetchBids,
  placeBidOnAuction,
  setAutoBidOnAuction,
  updateBidLive,
  setAuctionClosed,
} from "../../store/slices/auctionSlice";
import { getBidHistory } from "../../api/bids.api";
import Modal from "../../components/Modal";
import type { BidAuction } from "../../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

// Utility function to get current price
const getCurrentPrice = (auction: BidAuction): number => {
  // Priority: current_price > base_bid_price > base_price > 0
  const current = auction.current_price ?? auction.base_bid_price ?? auction.base_price ?? 0;
  const result = Number(current) || 0;
  console.log("getCurrentPrice for auction", auction.id, ":", {
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

export default function UserAuctions() {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const { list, loading } = useAppSelector((s) => s.auctions);
  const { user: currentUser } = useAppSelector((s) => s.auth);
  const [bidModal, setBidModal] = useState<{ id: string; current: number } | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidModal, setAutoBidModal] = useState<{ id: string; current: number } | null>(null);
  const [autoAmount, setAutoAmount] = useState("");
  const [historyModal, setHistoryModal] = useState<{ auction: BidAuction; history: BidHistoryItem[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    dispatch(fetchBids());
  }, [dispatch]);

  // Filter active and closed auctions
  const activeList = list.filter((b) => b.status === "active");
  const closedList = list.filter((b) => b.status === "closed");

  // Fetch current winner for each active auction
  useEffect(() => {
    const fetchCurrentWinners = async () => {
      for (const auction of activeList) {
        try {
          const response = await fetch(`${API_BASE}/api/bids/${auction.id}/current`);
          const data = await response.json();
          
          const winnerElement = document.getElementById(`winner-${auction.id}`);
          if (winnerElement) {
            if (data.highest_bid && data.highest_bid.name) {
              winnerElement.textContent = data.highest_bid.name;
              winnerElement.className = "text-xs font-semibold text-amber-700";
            } else {
              winnerElement.textContent = "No bids yet";
              winnerElement.className = "text-xs text-amber-600";
            }
          }
        } catch (error) {
          console.error(`Failed to fetch winner for auction ${auction.id}:`, error);
          const winnerElement = document.getElementById(`winner-${auction.id}`);
          if (winnerElement) {
            winnerElement.textContent = "No bids yet";
            winnerElement.className = "text-xs text-amber-600";
          }
        }
      }
    };

    if (activeList.length > 0) {
      fetchCurrentWinners();
    }
  }, [activeList]);

  useEffect(() => {
    if (!socket || !dispatch) return;
    list.forEach((b) => {
      if (b.status === "active") socket.emit("join-auction", b.id);
    });
    
    const onNewBid = (data: { bidId?: string; amount?: number; current_price?: number; winning_amount?: number; status?: string; winner_id?: string; highest_bidder?: string }) => {
      if (data.bidId) {
        dispatch(updateBidLive({ bidId: data.bidId, ...data }));
        
        // Update winner display in real-time
        if (data.highest_bidder) {
          const winnerElement = document.getElementById(`winner-${data.bidId}`);
          if (winnerElement) {
            winnerElement.textContent = data.highest_bidder;
            winnerElement.className = "text-xs font-semibold text-amber-700";
          }
        }

        // Update highest bid amount in real-time
        if (data.amount || data.current_price) {
          const bidAmountElement = document.getElementById(`bid-amount-${data.bidId}`);
          if (bidAmountElement) {
            const newAmount = data.amount || data.current_price;
            bidAmountElement.textContent = `$${Number(newAmount).toLocaleString()}`;
          }
        }

        // Refresh bid history if modal is open for this auction
        if (historyModal && historyModal.auction.id === data.bidId) {
          handleShowHistory(historyModal.auction);
        }
      }
    };
    
    const onClosed = (data: { bidId?: string }) => {
      if (data?.bidId) dispatch(setAuctionClosed(data.bidId));
    };

    const onAuctionStarted = (data: { auctionId: string; message: string }) => {
      console.log("Auction started:", data);
      toast.success(`New auction started!`);
      dispatch(fetchBids());
    };
    
    socket.on("new-bid", onNewBid);
    socket.on("auction-closed", onClosed);
    socket.on("auction-started", onAuctionStarted);
    
    return () => {
      socket.off("new-bid", onNewBid);
      socket.off("auction-closed", onClosed);
      socket.off("auction-started", onAuctionStarted);
    };
  }, [socket, list, dispatch]);

  const handlePlaceBid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bidModal) return;
    
    const amount = Number(bidAmount);
    const currentPrice = bidModal.current || 0;
    
    console.log("Bid validation:", {
      bidAmount,
      amount,
      currentPrice,
      isNaN: Number.isNaN(amount),
      isValid: amount > currentPrice
    });
    
    if (!bidAmount || bidAmount.trim() === "") {
      toast.error("Please enter a bid amount");
      return;
    }
    
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    
    // Check for more than 2 decimal places
    if (bidAmount.includes('.') && bidAmount.split('.')[1].length > 2) {
      toast.error("Bid amount can have at most 2 decimal places");
      return;
    }
    
    if (amount <= currentPrice) {
      toast.error(`Bid must be higher than current price ($${currentPrice.toFixed(2)})`);
      return;
    }
    
    dispatch(placeBidOnAuction({ id: bidModal.id, amount }))
      .unwrap()
      .then(() => {
        toast.success("Bid placed successfully!");
        setBidModal(null);
        setBidAmount("");
        dispatch(fetchBids());
      })
      .catch((e) => {
        console.error("Bid error:", e);
        toast.error(e || "Failed to place bid");
      });
  };

  const handleSetAutoBid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!autoBidModal) return;
    
    const max_amount = Number(autoAmount);
    const currentPrice = autoBidModal.current || 0;
    
    console.log("Auto-bid validation:", {
      autoAmount,
      max_amount,
      currentPrice,
      isNaN: Number.isNaN(max_amount),
      isValid: max_amount > currentPrice
    });
    
    if (!autoAmount || autoAmount.trim() === "") {
      toast.error("Please enter a maximum bid amount");
      return;
    }
    
    if (Number.isNaN(max_amount) || max_amount <= 0) {
      toast.error("Please enter a valid maximum amount");
      return;
    }
    
    // Check for more than 2 decimal places
    if (autoAmount.includes('.') && autoAmount.split('.')[1].length > 2) {
      toast.error("Maximum amount can have at most 2 decimal places");
      return;
    }
    
    if (max_amount <= currentPrice) {
      toast.error(`Maximum amount must be higher than current price ($${currentPrice.toFixed(2)})`);
      return;
    }
    
    dispatch(setAutoBidOnAuction({ id: autoBidModal.id, max_amount }))
      .unwrap()
      .then(() => {
        toast.success("Auto bid set successfully!");
        setAutoBidModal(null);
        setAutoAmount("");
      })
      .catch((e) => {
        console.error("Auto-bid error:", e);
        toast.error(e || "Failed to set auto bid");
      });
  };

  const handleShowHistory = async (auction: BidAuction) => {
    setLoadingHistory(true);
    try {
      const response = await getBidHistory(auction.id);
      console.log("Bid history response:", response.data);
      
      // Parse history field if it's a string
      const processedHistory = response.data.bid_history?.map((bid: any) => {
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
      
      console.log("Processed history:", processedHistory);
      
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Browse Auctions</h1>
      {loading ? (
        <p>Loading...</p>
      ) : activeList.length === 0 && closedList.length === 0 ? (
        <p className="text-slate-600">No auctions available.</p>
      ) : (
        <>
          {/* Active Auctions */}
          {activeList.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Auctions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeList.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl shadow overflow-hidden border border-slate-100"
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      {(b.diamond?.image_url ?? b.image_url) ? (
                        <div className="relative w-full h-full">
                          <img
                            src={
                              (b.diamond?.image_url ?? b.image_url)!.startsWith("http")
                                ? (b.diamond?.image_url ?? b.image_url)!
                                : `${API_BASE}${b.diamond?.image_url ?? b.image_url}`
                            }
                            alt={b.diamond?.name ?? b.diamond_name ?? ""}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const imgUrl = (b.diamond?.image_url ?? b.image_url)!.startsWith("http")
                                ? (b.diamond?.image_url ?? b.image_url)!
                                : `${API_BASE}${b.diamond?.image_url ?? b.image_url}`;
                              console.error("Image failed to load:", imgUrl);
                              console.error("Original image_url:", b.diamond?.image_url ?? b.image_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl absolute top-0 left-0 bg-slate-100" style={{display: 'none'}}>
                            💎
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
                          💎
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Live
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800">{b.diamond?.name ?? b.diamond_name ?? "Diamond"}</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Base: ${Number(b.base_bid_price ?? b.base_price ?? 0).toLocaleString()} • Current: $
                        {getCurrentPrice(b).toLocaleString()}
                      </p>
                      <p className="text-amber-600 font-medium text-sm mt-1 capitalize">{b.status}</p>
                      
                      {/* Show current winner info */}
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-amber-800">Current Leader:</span>
                          <span className="text-xs text-amber-700" id={`winner-${b.id}`}>
                            Loading...
                          </span>
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                          Highest Bid: <span id={`bid-amount-${b.id}`}>${getCurrentPrice(b).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            const currentPrice = getCurrentPrice(b);
                            console.log("Opening bid modal for auction:", b.id, "Current price:", currentPrice, "Auction data:", b);
                            setBidModal({ id: b.id, current: currentPrice });
                          }}
                          className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium"
                        >
                          Place bid
                        </button>
                        <button
                          onClick={() => {
                            const currentPrice = getCurrentPrice(b);
                            console.log("Opening auto-bid modal for auction:", b.id, "Current price:", currentPrice);
                            setAutoBidModal({ id: b.id, current: currentPrice });
                          }}
                          className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-sm font-medium"
                        >
                          Auto bid
                        </button>
                      </div>
                      <button
                        onClick={() => handleShowHistory(b)}
                        disabled={loadingHistory}
                        className="w-full mt-2 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                      >
                        {loadingHistory ? "Loading..." : "View Bid History"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closed Auctions */}
          {closedList.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Recently Closed Auctions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {closedList.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl shadow overflow-hidden border border-slate-100 opacity-90"
                  >
                    <div className="aspect-square bg-slate-100 relative">
                      {(b.diamond?.image_url ?? b.image_url) ? (
                        <div className="relative w-full h-full">
                          <img
                            src={
                              (b.diamond?.image_url ?? b.image_url)!.startsWith("http")
                                ? (b.diamond?.image_url ?? b.image_url)!
                                : `${API_BASE}${b.diamond?.image_url ?? b.image_url}`
                            }
                            alt={b.diamond?.name ?? b.diamond_name ?? ""}
                            className="w-full h-full object-cover"
                          />
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl absolute top-0 left-0 bg-slate-100" style={{display: 'none'}}>
                            💎
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
                          💎
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-1 bg-slate-500 text-white text-xs rounded-full">
                        Closed
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800">{b.diamond?.name ?? b.diamond_name ?? "Diamond"}</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Base: ${Number(b.base_bid_price ?? b.base_price ?? 0).toLocaleString()} • Final: $
                        {Number(b.winning_amount ?? b.current_price ?? 0).toLocaleString()}
                      </p>
                      <p className="text-slate-600 font-medium text-sm mt-1 capitalize">{b.status}</p>
                      
                      {/* Show winner info */}
                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-green-800">Winner:</span>
                          <span className="text-xs font-semibold text-green-700">
                            {b.winner_name || "No winner"}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Winning Bid: ${Number(b.winning_amount ?? 0).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleShowHistory(b)}
                        disabled={loadingHistory}
                        className="w-full mt-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                      >
                        {loadingHistory ? "Loading..." : "View Auction History"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={!!bidModal} onClose={() => { setBidModal(null); setBidAmount(""); }} title="Place Bid">
        {bidModal && (
          <form onSubmit={handlePlaceBid} className="space-y-4">
            <div>
              <p className="text-slate-600 mb-2">
                Current highest bid: <span className="font-semibold">${bidModal.current.toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-500 mb-3">
                Your bid must be higher than ${bidModal.current.toFixed(2)}
              </p>
            </div>
            <input
              type="number"
              min={bidModal.current + 0.01}
              step="0.01"
              placeholder={`Enter amount (minimum $${(bidModal.current + 0.01).toFixed(2)})`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
              autoFocus
            />
            <button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={!bidAmount || Number(bidAmount) <= bidModal.current}
            >
              Place Bid {bidAmount ? `($${Number(bidAmount).toFixed(2)})` : ''}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!autoBidModal} onClose={() => { setAutoBidModal(null); setAutoAmount(""); }} title="Set Auto Bid">
        {autoBidModal && (
          <form onSubmit={handleSetAutoBid} className="space-y-4">
            <div>
              <p className="text-slate-600 mb-2">
                Current highest bid: <span className="font-semibold">${autoBidModal.current.toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-500 mb-3">
                Set your maximum bid amount. The system will automatically bid for you up to this amount.
              </p>
            </div>
            <input
              type="number"
              min={autoBidModal.current + 0.01}
              step="0.01"
              placeholder={`Maximum amount (minimum $${(autoBidModal.current + 0.01).toFixed(2)})`}
              value={autoAmount}
              onChange={(e) => setAutoAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
              autoFocus
            />
            <button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={!autoAmount || Number(autoAmount) <= autoBidModal.current}
            >
              Set Auto Bid {autoAmount ? `(Max: $${Number(autoAmount).toFixed(2)})` : ''}
            </button>
          </form>
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
            {/* Current User Info */}
            {currentUser && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">Your Profile</div>
                    <div className="text-sm text-blue-600">
                      {currentUser.name} ({currentUser.email})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs ${
                      currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentUser.role.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {/* User's participation in this auction */}
                {(() => {
                  const userBids = historyModal.history.filter(bid => bid.user_id === currentUser.id);
                  const userHighestBid = userBids.length > 0 ? Math.max(...userBids.map(bid => bid.current_amount)) : 0;
                  const isUserWinner = userBids.some(bid => bid.is_winner);
                  const isUserLeading = historyModal.history.length > 0 && historyModal.history[0].user_id === currentUser.id;
                  
                  if (userBids.length > 0) {
                    return (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="text-sm text-blue-700">
                          <div className="flex justify-between">
                            <span>Your bids placed:</span>
                            <span className="font-medium">{userBids.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your highest bid:</span>
                            <span className="font-medium">${userHighestBid.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium ${
                              isUserWinner ? 'text-green-700' : 
                              isUserLeading ? 'text-amber-700' : 'text-slate-600'
                            }`}>
                              {isUserWinner ? '🏆 Winner' : 
                               isUserLeading ? '👑 Leading' : '📊 Participating'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <div className="text-sm text-blue-600">
                          You haven't placed any bids on this auction yet.
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Status:</span>
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
                  <div className="text-4xl mb-2">🏷️</div>
                  <p>No bids placed yet</p>
                  <p className="text-sm">Be the first to bid!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-600 mb-3">
                    Showing {historyModal.history.length} bid{historyModal.history.length !== 1 ? 's' : ''} (highest to lowest)
                  </div>
                  {historyModal.history.map((bid, index) => {
                    const isCurrentUser = currentUser && bid.user_id === currentUser.id;
                    return (
                    <div 
                      key={`${bid.user_id}-${bid.created_at}`}
                      className={`p-3 rounded-lg border ${
                        index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                      } ${bid.is_winner ? 'ring-2 ring-green-500' : ''} ${
                        isCurrentUser ? 'ring-2 ring-blue-300 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {isCurrentUser && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                You
                              </span>
                            )}
                            {index === 0 && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Current Leader
                              </span>
                            )}
                            {bid.is_winner && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Winner 🏆
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            <div>{formatDateTime(bid.created_at)}</div>
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
                    );
                  })}
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
