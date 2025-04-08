import { IStorage, Connection, Message, Post, User, Product, Bid } from "./types.js";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private posts: Map<number, Post> = new Map();
  private users: Map<number, User> = new Map();
  private products: Map<number, Product> = new Map();
  private bids: Map<number, Bid> = new Map();
  private connections: Map<number, Connection> = new Map();
  private messageQueue: Message[] = [];
  private currentId = 1;
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });

    // Add demo data
    const demoProducts: Product[] = [
      {
        id: 1,
        name: "Organic Tomatoes",
        description: "Fresh organic tomatoes from local farm",
        price: 120,
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
        category: "produce",
        status: "active",
        currentBid: 120,
        biddingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "Fresh Carrots",
        description: "Sweet and crunchy carrots",
        price: 80,
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
        category: "produce",
        status: "active",
        currentBid: 80,
        biddingEndTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    demoProducts.forEach(product => this.products.set(product.id, product));
  }

  // Post operations
  async createPost(post: Omit<Post, "id" | "createdAt" | "updatedAt">): Promise<Post> {
    const id = this.currentId++;
    const now = new Date();
    const newPost: Post = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.posts.set(id, newPost);
    return newPost;
  }

  async getPost(id: number): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) {
      throw new Error("Post not found");
    }
    const updatedPost = { ...post, ...data, updatedAt: new Date() };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    if (!this.posts.has(id)) {
      throw new Error("Post not found");
    }
    this.posts.delete(id);
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  // User operations
  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: now
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.username === username) || null;
  }

  // Product operations
  async createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const id = this.currentId++;
    const now = new Date();
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      status: product.status || "active",
      currentBid: product.currentBid || null,
      biddingEndTime: product.biddingEndTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: product.userId,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async getProduct(id: number): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error("Product not found");
    }
    const updatedProduct = {
      ...product,
      ...data,
      updatedAt: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  // Bid operations
  async createBid(bid: Omit<Bid, "id" | "createdAt">): Promise<Bid> {
    const id = this.currentId++;
    const now = new Date();
    const newBid: Bid = {
      ...bid,
      id,
      createdAt: now
    };
    this.bids.set(id, newBid);
    return newBid;
  }

  async getBid(id: number): Promise<Bid | null> {
    return this.bids.get(id) || null;
  }

  async getBidsByProduct(productId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => bid.productId === productId);
  }

  // Connection operations
  async createConnection(connection: Omit<Connection, "id" | "createdAt">): Promise<Connection> {
    const id = this.currentId++;
    const now = new Date();
    const newConnection: Connection = {
      ...connection,
      id,
      createdAt: now
    };
    this.connections.set(id, newConnection);
    return newConnection;
  }

  async getConnection(id: number): Promise<Connection | null> {
    return this.connections.get(id) || null;
  }

  // Message operations
  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const id = this.currentId++;
    const now = new Date();
    const newMessage: Message = {
      ...message,
      id,
      createdAt: now
    };
    this.messageQueue.push(newMessage);
    return newMessage;
  }

  async getMessages(): Promise<Message[]> {
    return this.messageQueue;
  }
}

export const storage = new MemStorage();