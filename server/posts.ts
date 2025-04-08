import { Router } from 'express';
import { storage } from './storage.js';
import { insertPostSchema } from './schema.js';
import { Post } from './types.js';

const router = Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await storage.getAllPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const data = insertPostSchema.parse(req.body);
    const post = await storage.createPost({
      ...data,
      userId: req.user?.id,
      likes: 0,
      shares: 0,
      saves: 0
    });
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ error: 'Invalid post data' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await storage.deletePost(postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like a post
router.post('/:id/like', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await storage.getPost(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await storage.updatePost(postId, {
      likes: (post.likes || 0) + 1
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

export function setupPostRoutes(app: Express) {
  app.use('/api/posts', router);
} 