import express from "express";
import { Server } from "socket.io";
import { storage } from "./storage.js";
import { User } from "./types.js";

export async function registerRoutes(app: express.Application, io?: Server) {
  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, name, userType, location } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password,
        name,
        userType,
        location
      });

      // Notify connected clients about new user
      if (io) {
        io.emit("user:registered", { username, userType });
      }

      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set user in session
      req.session.user = { 
        id: user.id, 
        username: user.username, 
        userType: user.userType 
      };
      
      res.json({ message: "Login successful", user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  return app;
} 