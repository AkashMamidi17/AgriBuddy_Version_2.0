import { InsertUser, User, Product, Post, Bid } from "../shared/schema";
import session from "express-session";

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>;
  
  // Bid operations
  createBid(bid: Omit<Bid, "id" | "createdAt">): Promise<Bid>;
  
  // Post operations
  getAllPosts(): Promise<Post[]>;
  createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post>;
}