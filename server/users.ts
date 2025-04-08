import { Router } from 'express';
import { storage } from './storage.js';
import { User } from './types.js';

const router = Router();

// Get current user
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send sensitive information
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    
    const updatedUser = await storage.updateUser(userId, req.body);
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export function setupUserRoutes(app: Express) {
  app.use('/api/users', router);
} 