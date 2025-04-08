import { Store } from "express-session";

export interface Connection {
  id: number;
  userId: number;
  socketId: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  userId: number;
  content: string;
  createdAt: Date;
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
  amount: number;
  userId: number;
  productId: number;
  createdAt: Date;
}

export interface IStorage {
  // Post operations
  createPost(post: Omit<Post, "id" | "createdAt" | "updatedAt">): Promise<Post>;
  getPost(id: number): Promise<Post | null>;
  updatePost(id: number, data: Partial<Post>): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  deletePost(id: number): Promise<void>;

  // User operations
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;

  // Product operations
  createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  getProduct(id: number): Promise<Product | null>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  getAllProducts(): Promise<Product[]>;

  // Bid operations
  createBid(bid: Omit<Bid, "id" | "createdAt">): Promise<Bid>;
  getBid(id: number): Promise<Bid | null>;
  getBidsByProduct(productId: number): Promise<Bid[]>;

  // Connection operations
  createConnection(connection: Omit<Connection, "id" | "createdAt">): Promise<Connection>;
  getConnection(id: number): Promise<Connection | null>;

  // Message operations
  createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message>;
  getMessages(): Promise<Message[]>;

  sessionStore: Store;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  videoUrl: string | null;
  videoThumbnail: string | null;
  likes: number;
  shares: number;
  saves: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface User {
  id: string;
  username: string;
  password: string;
  userType: 'farmer' | 'buyer';
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser {
  username: string;
  password: string;
  name: string;
  userType: "farmer" | "buyer";
  location: string;
}