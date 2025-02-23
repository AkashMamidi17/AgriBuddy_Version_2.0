import { IStorage } from "./types";
import { User, Product, Post, Bid, InsertUser, InsertBid } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// Demo data
const demoProducts = [
  {
    id: 1,
    title: "Organic Rice",
    description: "Premium quality organic rice grown using traditional farming methods.",
    price: 60,
    userId: 1,
    images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
    status: "active",
    currentBid: 65,
    biddingEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date()
  },
  {
    id: 2,
    title: "Fresh Vegetables Bundle",
    description: "Assorted fresh vegetables directly from our farm.",
    price: 120,
    userId: 1,
    images: ["https://images.unsplash.com/photo-1518843875459-f738682238a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
    status: "active",
    currentBid: 130,
    biddingEndTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    createdAt: new Date()
  }
];

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private posts: Map<number, Post>;
  private bids: Map<number, Bid>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.posts = new Map();
    this.bids = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with demo data
    demoProducts.forEach(product => this.products.set(product.id, product as Product));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const id = this.currentId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");

    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async createBid(bid: Omit<Bid, "id" | "createdAt">): Promise<Bid> {
    const id = this.currentId++;
    const newBid: Bid = { ...bid, id, createdAt: new Date() };
    this.bids.set(id, newBid);
    return newBid;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async createPost(insertPost: any): Promise<Post> {
    const id = this.currentId++;
    const post: Post = { ...insertPost, id, createdAt: new Date() };
    this.posts.set(id, post);
    return post;
  }
}

export const storage = new MemStorage();