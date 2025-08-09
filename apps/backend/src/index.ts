import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import redis, { redisSubscriber } from './redis';
import { CanvasManager } from './canvas';
import { AnalyticsManager } from './analytics';
import { PixelUpdateData } from './types';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/canvas', async (req, res) => {
  try {
    const snapshot = await CanvasManager.getSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error('Error getting canvas snapshot:', error);
    res.status(500).json({ error: 'Failed to get canvas snapshot' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await AnalyticsManager.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await AnalyticsManager.getTopUsers(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

app.get('/api/activity', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 50;
    const activity = await AnalyticsManager.getRecentActivity(count);
    res.json(activity);
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await AnalyticsManager.getUserProfile(userId);
    
    const rank = await AnalyticsManager.getUserRank(userId);
    
    res.json({
      profile,
      rank: rank.rank
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

app.get('/api/heatmap', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.hours as string) || 24; // Last 24 hours by default
    const skipCache = req.query.nocache === 'true'; // Skip cache if nocache=true
    const heatmapData = await CanvasManager.getHeatmapData(timeRange, skipCache);
    res.json(heatmapData);
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});

// Badges endpoint
app.get('/api/badges', async (req, res) => {
  try {
    const badgesData = await redis.call('JSON.GET', 'badges', '$') as string | null;
    if (badgesData && badgesData !== 'null') {
      const badgesArray = JSON.parse(badgesData);
      const badges = Array.isArray(badgesArray) ? badgesArray[0] : badgesArray;
      res.json(badges);
    } else {
      res.json({ badges: [], totalCount: 0, lastUpdated: null });
    }
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

redisSubscriber.subscribe('canvas:updates');
redisSubscriber.on('message', (channel, message) => {
  if (channel === 'canvas:updates') {
    try {
      const update: PixelUpdateData = JSON.parse(message);
      io.emit('pixel-update', update);
    } catch (error) {
      console.error('Error processing canvas update:', error);
    }
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-canvas', async (data) => {
    console.log('Client joined canvas:', data.userId);
    
    // Track unique visitor
    await AnalyticsManager.trackUniqueVisitor(data.userId);
    
    socket.emit('canvas-loaded', { success: true });
  });

  socket.on('place-pixel', async (data) => {
    console.log('Received place-pixel event:', data);
    try {
      const { x, y, color, userId } = data;
      
      console.log('Parsed pixel data:', { x, y, color, userId, types: { x: typeof x, y: typeof y, color: typeof color } });
      
      if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'number') {
        console.log('Invalid pixel data types');
        socket.emit('error', { message: 'Invalid pixel data' });
        return;
      }

      console.log('Setting pixel in Redis...');
      await CanvasManager.setPixel(x, y, color);
      console.log('Pixel set successfully');

      const updateData: PixelUpdateData = {
        x,
        y,
        color,
        userId,
        timestamp: Date.now()
      };

      // Track analytics
      const now = Date.now();
      await Promise.all([
        AnalyticsManager.incrementUserScore(userId), // Leaderboard
        AnalyticsManager.incrementColorUsage(color), // Color stats
        AnalyticsManager.addActivity({ userId, x, y, color }), // Activity stream
        AnalyticsManager.updateUserProfile(userId, {
          pixelsPlaced: 1,
          colorUsed: color,
          lastPixelTime: now,
          firstPixelTime: now // Will only set if it's null
        }).then(async () => {
          // Check for badge achievements after profile update
          try {
            const key = `user:profile:${userId}`;
            const profileData = await redis.call('JSON.GET', key, '$') as string | null;
            if (profileData && profileData !== 'null') {
              const profileArray = JSON.parse(profileData);
              const profile = Array.isArray(profileArray) ? profileArray[0] : profileArray;
              await AnalyticsManager.checkAndAwardBadges(
                userId, 
                profile.pixelsPlaced, 
                profile.colorUsage
              );
            }
          } catch (error) {
            console.error('Error checking badges:', error);
          }
        })
      ]);

      console.log('Publishing update:', updateData);
      await redis.publish('canvas:updates', JSON.stringify(updateData));
      console.log('Update published');

    } catch (error) {
      console.error('Error placing pixel:', error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to place pixel' 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function startServer() {
  try {
    await CanvasManager.initializeCanvas();
    console.log('Canvas initialized');

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();