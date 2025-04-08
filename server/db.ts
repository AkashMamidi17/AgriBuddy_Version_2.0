import dotenv from 'dotenv';

dotenv.config();

class InMemoryDB {
  private users: any[] = [];
  private products: any[] = [];
  private posts: any[] = [];
  private nextId = 1;

  async query(sql: string, params?: any[]) {
    // For development, just return empty results
    return [[], []];
  }

  // Helper methods for CRUD operations
  async createUser(user: any) {
    const newUser = { ...user, id: this.nextId++ };
    this.users.push(newUser);
    return newUser;
  }

  async getUser(id: number) {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string) {
    return this.users.find(u => u.username === username);
  }

  async createProduct(product: any) {
    const newProduct = { ...product, id: this.nextId++ };
    this.products.push(newProduct);
    return newProduct;
  }

  async getProduct(id: number) {
    return this.products.find(p => p.id === id);
  }

  async getAllProducts() {
    return this.products;
  }

  async createPost(post: any) {
    const newPost = { ...post, id: this.nextId++ };
    this.posts.push(newPost);
    return newPost;
  }

  async getPost(id: number) {
    return this.posts.find(p => p.id === id);
  }

  async getAllPosts() {
    return this.posts;
  }
}

const db = new InMemoryDB();

export const setupDatabase = async () => {
  try {
    console.log('Using in-memory database for development');
  } catch (error) {
    console.error('Error setting up in-memory database:', error);
    throw error;
  }
};

export default db;