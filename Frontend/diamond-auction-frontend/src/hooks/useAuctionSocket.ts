import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { updateBidLive, setAuctionClosed } from "../store/slices/auctionSlice";

export function useAuctionSocket(socket: ReturnType<typeof import("../context/SocketContext").useSocket>, bidId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !bidId) return;
    socket.emit("join-auction", bidId);

    const onNewBid = (data: { current_price?: number; winning_amount?: number; status?: string; winner_id?: string }) => {
      dispatch(updateBidLive({ bidId, ...data }));
    };
    const onAuctionClosed = () => {
      dispatch(setAuctionClosed(bidId));
    };

    socket.on("new-bid", onNewBid);
    socket.on("auction-closed", onAuctionClosed);

    return () => {
      socket.off("new-bid", onNewBid);
      socket.off("auction-closed", onAuctionClosed);
    };
  }, [socket, bidId, dispatch]);
}
