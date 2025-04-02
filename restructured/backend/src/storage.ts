import { IStorage } from "./types";
import { User, Product, Post, Bid } from "@shared/schema";
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
  },
  {
    id: 3,
    title: "Organic Cotton",
    description: "High-quality cotton harvested from sustainable farms.",
    price: 200,
    userId: 2,
    images: ["https://images.unsplash.com/photo-1573676048035-9c2a72b6a12a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"],
    status: "active",
    currentBid: 210,
    biddingEndTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
    createdAt: new Date()
  }
];

const demoPosts = [
  {
    id: 1,
    title: "Sustainable Farming Practices",
    content: "Here are some tips for sustainable farming in Telangana...",
    userId: 1,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
    this.currentId = 4; // Start after demo data
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with demo data
    demoProducts.forEach(product => this.products.set(product.id, product as Product));
    demoPosts.forEach(post => this.posts.set(post.id, post as Post));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id, createdAt: new Date() } as User;
    this.users.set(id, user);
    return user;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const id = this.currentId++;
    const newProduct = { ...product, id, createdAt: new Date() } as Product;
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");

    const updatedProduct = { ...product, ...updates } as Product;
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async createBid(bid: Omit<Bid, "id" | "createdAt">): Promise<Bid> {
    const id = this.currentId++;
    const newBid = { ...bid, id, createdAt: new Date() } as Bid;
    this.bids.set(id, newBid);
    return newBid;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async createPost(post: Omit<Post, "id" | "createdAt">): Promise<Post> {
    const id = this.currentId++;
    const newPost = { ...post, id, createdAt: new Date() } as Post;
    this.posts.set(id, newPost);
    return newPost;
  }
}

export const storage = new MemStorage();