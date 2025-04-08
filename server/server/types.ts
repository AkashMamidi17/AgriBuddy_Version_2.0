export interface User {
  id: number;
  username: string;
  password: string;
  userType: string;
  name: string;
  location: string | null;
  createdAt: Date | null;
}

export interface Product {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: number;
  productId: number;
  userId: number;
  amount: number;
  createdAt: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  likes: number;
  shares: number;
  saves: number;
  createdAt: Date;
  updatedAt: Date;
} 