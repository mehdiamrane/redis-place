import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import redis, { redisSubscriber } from './redis';
import { CanvasManager } from './canvas';
import { AnalyticsManager } from './analytics';
import { PixelUpdateData } from './types';
import { AuthManager, authenticateSession, optionalAuth, AuthenticatedRequest } from './auth';
import { initializeBadges } from './badges';

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

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be strings' });
  }
  
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Only allow alphanumeric usernames with underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }
  
  const result = await AuthManager.registerUser(username, password);
  
  if (result.success) {
    res.json({ sessionToken: result.sessionToken, username });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const result = await AuthManager.loginUser(username, password);
  
  if (result.success) {
    res.json({ sessionToken: result.sessionToken, username });
  } else {
    res.status(401).json({ error: result.error });
  }
});

app.post('/auth/logout', authenticateSession, async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const sessionToken = authHeader.replace('Bearer ', '');
    await AuthManager.revokeSession(sessionToken);
  }
  
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/verify', authenticateSession, (req: AuthenticatedRequest, res) => {
  res.json({ username: req.user?.username, authenticated: true });
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
    let badgesData = await redis.call('JSON.GET', 'badges', '$') as string | null;
    
    // Initialize badges if they don't exist
    if (!badgesData || badgesData === 'null') {
      await initializeBadges();
      badgesData = await redis.call('JSON.GET', 'badges', '$') as string | null;
    }
    
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

// Replay API endpoint
app.get('/api/replay', async (req, res) => {
  try {
    const startTime = req.query.start ? parseInt(req.query.start as string) : undefined;
    const endTime = req.query.end ? parseInt(req.query.end as string) : undefined;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Both start and end timestamps are required',
        example: '/api/replay?start=1628097234567&end=1628183634567'
      });
    }
    
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }
    
    // Check if date range is too large (more than 30 days)
    const maxRange = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (endTime - startTime > maxRange) {
      return res.status(400).json({ 
        error: 'Date range too large. Maximum allowed is 30 days.',
        maxRangeDays: 30
      });
    }
    
    // Use Redis native time filtering
    const streamStart = `${startTime}-0`;
    const streamEnd = `${endTime}-0`;
    
    const results = await redis.xrange('stream:activity', streamStart, streamEnd);
    
    const pixelEvents = results
      .map(([id, fields]) => {
        const data: any = { id };
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }
        return data;
      })
      .filter(data => data.type === 'pixel' || !data.type) // Filter for pixel events only
      .map(data => ({
        id: data.id,
        userId: data.userId,
        x: parseInt(data.x),
        y: parseInt(data.y),
        color: parseInt(data.color),
        timestamp: parseInt(data.timestamp)
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically
    
    res.json({
      events: pixelEvents,
      totalCount: pixelEvents.length,
      timeRange: {
        start: startTime,
        end: endTime,
        actualStart: pixelEvents[0]?.timestamp || null,
        actualEnd: pixelEvents[pixelEvents.length - 1]?.timestamp || null
      }
    });
  } catch (error) {
    console.error('Error getting replay data:', error);
    res.status(500).json({ error: 'Failed to get replay data' });
  }
});

// Pixel Info API endpoint
app.get('/api/pixel-info/:x/:y', async (req, res) => {
  try {
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);
    
    if (isNaN(x) || isNaN(y) || x < 0 || x >= 1000 || y < 0 || y >= 1000) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    // First, check if pixel has a color (non-zero)
    let currentColor = 0;
    try {
      currentColor = await CanvasManager.getPixel(x, y);
    } catch (error) {
      console.error('Error getting current pixel color:', error);
      return res.status(500).json({ error: 'Failed to get pixel color' });
    }
    
    // If pixel is empty (ID 0), don't search
    if (currentColor === 0) {
      return res.json({
        x,
        y,
        currentColor: 0,
        lastPlacement: null,
        message: 'This pixel is empty (no color placed)'
      });
    }
    
    // Progressive search: Start with recent 10K events
    console.log(`Searching for last placement at (${x}, ${y})`);
    
    let searchResult = null;
    let searchEndTime = Date.now();
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops
    const batchSize = 10000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    while (!searchResult && attempts < maxAttempts) {
      attempts++;
      
      console.log(`Search attempt ${attempts}, searching from ${new Date(searchEndTime).toISOString()}`);
      
      // Get recent batch of events (reverse chronological)
      const results = await redis.xrevrange('stream:activity', `${searchEndTime}-0`, '-', 'COUNT', batchSize);
      
      if (results.length === 0) {
        console.log('No more events to search');
        break; // No more events
      }
      
      // Search through this batch for our pixel
      for (const [id, fields] of results) {
        const data: any = { id };
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }
        
        // Check if this is a pixel event at our coordinates
        if ((data.type === 'pixel' || !data.type) && 
            parseInt(data.x) === x && 
            parseInt(data.y) === y) {
          
          searchResult = {
            userId: data.userId,
            x: parseInt(data.x),
            y: parseInt(data.y),
            color: parseInt(data.color),
            timestamp: parseInt(data.timestamp)
          };
          console.log(`Found pixel placement:`, searchResult);
          break;
        }
      }
      
      if (!searchResult) {
        // Get timestamp of oldest event in this batch for next iteration
        const oldestEvent = results[results.length - 1];
        const oldestTimestamp = parseInt(oldestEvent[0].split('-')[0]);
        
        // Move search window back by 7 days from the oldest event we just checked
        searchEndTime = oldestTimestamp - sevenDaysMs;
        
        if (searchEndTime <= 0) {
          console.log('Reached beginning of time');
          break;
        }
      }
    }
    
    if (!searchResult) {
      return res.json({
        x,
        y,
        currentColor,
        lastPlacement: null,
        message: `No placement found after searching ${attempts} batches`,
        searchAttempts: attempts
      });
    }
    
    res.json({
      x,
      y,
      currentColor,
      lastPlacement: searchResult,
      searchAttempts: attempts
    });
    
  } catch (error) {
    console.error('Error getting pixel info:', error);
    res.status(500).json({ error: 'Failed to get pixel info' });
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
    console.log('Client joined canvas');
    
    // Track both authenticated and anonymous users
    if (data?.sessionToken) {
      // Try to track authenticated user
      const authResult = await AuthManager.validateSession(data.sessionToken);
      if (authResult.valid && authResult.username) {
        console.log('Tracking authenticated visitor:', authResult.username);
        await AnalyticsManager.trackUniqueVisitor(`user:${authResult.username}`);
      } else {
        // Invalid session, track as anonymous
        console.log('Tracking anonymous visitor (invalid session):', socket.id);
        await AnalyticsManager.trackUniqueVisitor(`anonymous_${socket.id}`);
      }
    } else {
      // No session token, track as anonymous user
      console.log('Tracking anonymous visitor:', socket.id);
      await AnalyticsManager.trackUniqueVisitor(`anonymous_${socket.id}`);
    }
    
    socket.emit('canvas-loaded', { success: true });
  });

  socket.on('place-pixel', async (data) => {
    console.log('Received place-pixel event:', data);
    try {
      const { x, y, color, sessionToken } = data;
      
      console.log('Parsed pixel data:', { x, y, color, types: { x: typeof x, y: typeof y, color: typeof color } });
      
      if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'number') {
        console.log('Invalid pixel data types');
        socket.emit('error', { message: 'Invalid pixel data' });
        return;
      }

      // Require authentication for pixel placement
      if (!sessionToken) {
        console.log('No session token provided');
        socket.emit('auth-required', { message: 'Authentication required to place pixels' });
        return;
      }

      // Validate session
      const authResult = await AuthManager.validateSession(sessionToken);
      if (!authResult.valid || !authResult.username) {
        console.log('Invalid session token');
        socket.emit('auth-required', { message: 'Invalid or expired session. Please log in again.' });
        return;
      }

      // Use authenticated username instead of client-provided userId
      const authenticatedUserId = `user:${authResult.username}`;
      
      // Rate limiting: Check if user is still in cooldown
      const cooldownMs = parseInt(process.env.PIXEL_COOLDOWN_MS || '1000');
      const backendCooldownMs = cooldownMs - 500; // Subtract 200ms buffer to be more lenient than frontend
      const profileKey = `userprofile:${authenticatedUserId}`;
      
      try {
        const profileData = await redis.call('JSON.GET', profileKey, '$.lastPixelTime') as string | null;
        if (profileData && profileData !== 'null') {
          const lastPixelTimeArray = JSON.parse(profileData);
          const lastPixelTime = Array.isArray(lastPixelTimeArray) ? lastPixelTimeArray[0] : null;
          
          if (lastPixelTime && typeof lastPixelTime === 'number') {
            const timeSinceLastPixel = Date.now() - lastPixelTime;
            if (timeSinceLastPixel < backendCooldownMs) {
              const remainingCooldown = Math.ceil((backendCooldownMs - timeSinceLastPixel) / 1000);
              console.log(`Rate limiting user ${authResult.username}: ${timeSinceLastPixel}ms < ${backendCooldownMs}ms (${cooldownMs}ms - 500ms buffer)`);
              socket.emit('rate-limited', { 
                message: `Rate limit exceeded. Try again in ${remainingCooldown}s.`,
                remainingSeconds: remainingCooldown,
                x,
                y
              });
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking rate limit:', error);
        // Continue with pixel placement if rate limit check fails
      }
      
      console.log('Setting pixel in Redis...');
      await CanvasManager.setPixel(x, y, color);
      console.log('Pixel set successfully');

      const updateData: PixelUpdateData = {
        x,
        y,
        color,
        userId: authenticatedUserId,
        timestamp: Date.now()
      };

      // Track analytics using authenticated user ID
      const now = Date.now();
      await Promise.all([
        AnalyticsManager.incrementUserScore(authenticatedUserId), // Leaderboard
        AnalyticsManager.incrementColorUsage(color), // Color stats
        AnalyticsManager.addActivity({ userId: authenticatedUserId, x, y, color }), // Activity stream
        AnalyticsManager.updateUserProfile(authenticatedUserId, {
          pixelsPlaced: 1,
          colorUsed: color,
          lastPixelTime: now,
          firstPixelTime: now // Will only set if it's null
        }).then(async () => {
          // Check for badge achievements after profile update
          try {
            const key = `userprofile:${authenticatedUserId}`;
            const profileData = await redis.call('JSON.GET', key, '$') as string | null;
            if (profileData && profileData !== 'null') {
              const profileArray = JSON.parse(profileData);
              const profile = Array.isArray(profileArray) ? profileArray[0] : profileArray;
              await AnalyticsManager.checkAndAwardBadges(
                authenticatedUserId, 
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