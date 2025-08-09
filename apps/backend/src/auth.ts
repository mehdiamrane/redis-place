import bcrypt from "bcrypt";
import crypto from "crypto";
import redis from "./redis";
import { Request, Response, NextFunction } from "express";

interface AuthUser {
  username: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export class AuthManager {
  static async registerUser(
    username: string,
    password: string
  ): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    try {
      // Check if username already exists
      const userExists = await redis.exists(`user:${username}`);
      if (userExists) {
        return { success: false, error: "Username already taken" };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Store user data
      await redis.hset(`user:${username}`, {
        password: hashedPassword,
        createdAt: Date.now().toString(),
      });

      // Create session with 30-day sliding window
      const sessionToken = crypto.randomUUID();
      await redis.setex(`session:${sessionToken}`, SESSION_DURATION, username);

      return { success: true, sessionToken };
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  static async loginUser(
    username: string,
    password: string
  ): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
    try {
      // Get user data
      const userData = await redis.hgetall(`user:${username}`);
      if (!userData.password) {
        return { success: false, error: "Invalid credentials" };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid credentials" };
      }

      // Create session with 30-day sliding window
      const sessionToken = crypto.randomUUID();
      await redis.setex(`session:${sessionToken}`, SESSION_DURATION, username);

      return { success: true, sessionToken };
    } catch (error) {
      console.error("Error logging in user:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  static async validateSession(sessionToken: string): Promise<{ valid: boolean; username?: string }> {
    try {
      const username = await redis.get(`session:${sessionToken}`);
      if (!username) {
        return { valid: false };
      }

      // Refresh session (sliding window) - reset to 30 days
      await redis.setex(`session:${sessionToken}`, SESSION_DURATION, username);

      return { valid: true, username };
    } catch (error) {
      console.error("Error validating session:", error);
      return { valid: false };
    }
  }

  static async revokeSession(sessionToken: string): Promise<void> {
    try {
      await redis.del(`session:${sessionToken}`);
    } catch (error) {
      console.error("Error revoking session:", error);
    }
  }
}

// Authentication middleware
export function authenticateSession(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No session token provided" });
    return;
  }

  const sessionToken = authHeader.replace("Bearer ", "");

  AuthManager.validateSession(sessionToken)
    .then(({ valid, username }) => {
      if (!valid || !username) {
        res.status(401).json({ error: "Invalid or expired session" });
        return;
      }

      req.user = { username };
      next();
    })
    .catch((error) => {
      console.error("Authentication middleware error:", error);
      res.status(500).json({ error: "Authentication error" });
    });
}

// Optional authentication middleware - doesn't fail if no auth provided
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const sessionToken = authHeader.replace("Bearer ", "");

  AuthManager.validateSession(sessionToken)
    .then(({ valid, username }) => {
      if (valid && username) {
        req.user = { username };
      }
      next();
    })
    .catch((error) => {
      console.error("Optional authentication error:", error);
      next();
    });
}

export type { AuthenticatedRequest };
