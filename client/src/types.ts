export interface MarketplaceProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  status: string;
  currentBid: number | null;
  biddingEndTime: Date | null;
  userId: number;
} 