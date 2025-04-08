import { User, Product, Bid, Post } from "./types.js";

class MemStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private bids: Map<number, Bid>;
  private posts: Map<number, Post>;
  private userIdCounter: number;
  private productIdCounter: number;
  private bidIdCounter: number;
  private postIdCounter: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.bids = new Map();
    this.posts = new Map();
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.bidIdCounter = 1;
    this.postIdCounter = 1;
  }

  // User methods
  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      id,
      ...data,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.username === username) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async getProduct(id: number): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | null> {
    const product = await this.getProduct(id);
    if (!product) return null;

    const updatedProduct = {
      ...product,
      ...data,
      updatedAt: new Date(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Bid methods
  async createBid(data: Omit<Bid, "id" | "createdAt">): Promise<Bid> {
    const id = this.bidIdCounter++;
    const bid: Bid = {
      id,
      ...data,
      createdAt: new Date(),
    };
    this.bids.set(id, bid);
    return bid;
  }

  async getBid(id: number): Promise<Bid | null> {
    return this.bids.get(id) || null;
  }

  async getBidsByProduct(productId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => bid.productId === productId);
  }

  // Post methods
  async createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt">): Promise<Post> {
    const id = this.postIdCounter++;
    const post: Post = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getPost(id: number): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post | null> {
    const post = await this.getPost(id);
    if (!post) return null;

    const updatedPost = {
      ...post,
      ...data,
      updatedAt: new Date(),
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }
}

export const storage = new MemStorage(); 