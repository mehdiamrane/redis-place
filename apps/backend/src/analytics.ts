import redis from './redis';

export class AnalyticsManager {
  // Redis Keys
  private static readonly USER_LEADERBOARD_KEY = 'leaderboard:users';
  private static readonly DAILY_VISITORS_KEY_PREFIX = 'visitors:daily:';
  private static readonly HOURLY_VISITORS_KEY_PREFIX = 'visitors:hourly:';
  private static readonly ACTIVITY_STREAM_KEY = 'stream:activity';
  private static readonly USER_PROFILE_KEY_PREFIX = 'user:profile:';
  private static readonly COLOR_USAGE_KEY_PREFIX = 'stats:color:';

  // User Leaderboard (Redis Sorted Sets)
  static async incrementUserScore(userId: string, points: number = 1): Promise<void> {
    await redis.zincrby(this.USER_LEADERBOARD_KEY, points, userId);
  }

  static async getTopUsers(limit: number = 10): Promise<Array<{userId: string, score: number}>> {
    const results = await redis.zrevrange(this.USER_LEADERBOARD_KEY, 0, limit - 1, 'WITHSCORES');
    const leaderboard = [];
    
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        score: parseInt(results[i + 1])
      });
    }
    
    return leaderboard;
  }

  static async getUserRank(userId: string): Promise<{rank: number | null, score: number}> {
    const rank = await redis.zrevrank(this.USER_LEADERBOARD_KEY, userId);
    const score = await redis.zscore(this.USER_LEADERBOARD_KEY, userId);
    
    return {
      rank: rank !== null ? rank + 1 : null, // Convert to 1-based ranking
      score: parseInt(score || '0')
    };
  }

  // Unique Visitors (Redis HyperLogLog)
  static async trackUniqueVisitor(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    await Promise.all([
      redis.pfadd(`${this.DAILY_VISITORS_KEY_PREFIX}${today}`, userId),
      redis.pfadd(`${this.HOURLY_VISITORS_KEY_PREFIX}${currentHour}`, userId)
    ]);
  }

  static async getUniqueVisitorCount(type: 'daily' | 'hourly', date?: string): Promise<number> {
    let key: string;
    
    if (type === 'daily') {
      const targetDate = date || new Date().toISOString().split('T')[0];
      key = `${this.DAILY_VISITORS_KEY_PREFIX}${targetDate}`;
    } else {
      const targetHour = date || new Date().toISOString().slice(0, 13);
      key = `${this.HOURLY_VISITORS_KEY_PREFIX}${targetHour}`;
    }
    
    return await redis.pfcount(key);
  }

  // Activity Stream (Redis Streams)
  static async addActivity(data: {
    userId: string;
    x: number;
    y: number;
    color: number;
    timestamp?: number;
  }): Promise<void> {
    await redis.xadd(
      this.ACTIVITY_STREAM_KEY,
      '*', // Auto-generate ID
      'userId', data.userId,
      'x', data.x.toString(),
      'y', data.y.toString(),
      'color', data.color.toString(),
      'timestamp', (data.timestamp || Date.now()).toString()
    );
  }

  static async getRecentActivity(count: number = 50): Promise<Array<{
    id: string;
    userId: string;
    x: number;
    y: number;
    color: number;
    timestamp: number;
  }>> {
    const results = await redis.xrevrange(this.ACTIVITY_STREAM_KEY, '+', '-', 'COUNT', count);
    
    return results.map(([id, fields]) => {
      const data: any = { id };
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      
      return {
        id: data.id,
        userId: data.userId,
        x: parseInt(data.x),
        y: parseInt(data.y),
        color: parseInt(data.color),
        timestamp: parseInt(data.timestamp)
      };
    });
  }

  // User Profiles (Redis Hashes)
  static async updateUserProfile(userId: string, data: {
    pixelsPlaced?: number;
    colorUsed?: number;
    firstPixelTime?: number;
    lastPixelTime?: number;
  }): Promise<void> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    const updates: string[] = [];
    
    // Check if this is the user's first pixel
    const existingProfile = await redis.hmget(key, 'firstPixelTime');
    const isFirstPixel = !existingProfile[0];
    
    if (data.pixelsPlaced !== undefined) {
      updates.push('pixelsPlaced', data.pixelsPlaced.toString());
    }
    if (data.firstPixelTime !== undefined || isFirstPixel) {
      const firstTime = data.firstPixelTime || data.lastPixelTime || Date.now();
      updates.push('firstPixelTime', firstTime.toString());
    }
    if (data.lastPixelTime !== undefined) {
      updates.push('lastPixelTime', data.lastPixelTime.toString());
    }
    
    if (updates.length > 0) {
      await redis.hmset(key, ...updates);
    }

    // Handle color usage tracking separately
    if (data.colorUsed !== undefined) {
      await this.trackUserColorUsage(userId, data.colorUsed);
    }
  }

  // Track individual user color usage and update favorite color
  static async trackUserColorUsage(userId: string, color: number): Promise<void> {
    const profileKey = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    const colorField = `color_${color}`;
    
    // Increment this color's usage count in the main profile hash
    const newCount = await redis.hincrby(profileKey, colorField, 1);
    
    // Get all color fields from the profile to find the most used color
    const profileData = await redis.hgetall(profileKey);
    let favoriteColor = color;
    let maxCount = newCount;
    
    // Look through all color_* fields to find the most used one
    for (const [field, value] of Object.entries(profileData)) {
      if (field.startsWith('color_')) {
        const colorIndex = parseInt(field.replace('color_', ''));
        const count = parseInt(value);
        if (count > maxCount) {
          maxCount = count;
          favoriteColor = colorIndex;
        }
      }
    }
    
    // Update favorite color in the same profile hash
    await redis.hset(profileKey, 'favoriteColor', favoriteColor.toString());
  }

  static async incrementUserPixelCount(userId: string): Promise<number> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    return await redis.hincrby(key, 'pixelsPlaced', 1);
  }

  static async getUserProfile(userId: string): Promise<{
    pixelsPlaced: number;
    favoriteColor: number | null;
    firstPixelTime: number | null;
    lastPixelTime: number | null;
    colorUsage: Array<{color: number, count: number}>;
  } | null> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    const profileData = await redis.hgetall(key);
    
    if (!profileData || Object.keys(profileData).length === 0) {
      return null;
    }
    
    // Extract color usage data
    const colorUsage: Array<{color: number, count: number}> = [];
    for (const [field, value] of Object.entries(profileData)) {
      if (field.startsWith('color_')) {
        const colorIndex = parseInt(field.replace('color_', ''));
        const count = parseInt(value);
        if (count > 0) {
          colorUsage.push({ color: colorIndex, count });
        }
      }
    }
    
    // Sort by usage count (most used first)
    colorUsage.sort((a, b) => b.count - a.count);
    
    return {
      pixelsPlaced: parseInt(profileData.pixelsPlaced || '0'),
      favoriteColor: profileData.favoriteColor ? parseInt(profileData.favoriteColor) : null,
      firstPixelTime: profileData.firstPixelTime ? parseInt(profileData.firstPixelTime) : null,
      lastPixelTime: profileData.lastPixelTime ? parseInt(profileData.lastPixelTime) : null,
      colorUsage
    };
  }

  // Color Statistics
  static async incrementColorUsage(color: number): Promise<void> {
    const key = `${this.COLOR_USAGE_KEY_PREFIX}${color}`;
    await redis.incr(key);
  }

  static async getColorUsageStats(): Promise<Array<{color: number, count: number}>> {
    const keys = [];
    for (let i = 0; i < 16; i++) { // Assuming 16 colors (0-15)
      keys.push(`${this.COLOR_USAGE_KEY_PREFIX}${i}`);
    }
    
    const counts = await redis.mget(...keys);
    const stats = [];
    
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] && parseInt(counts[i]!) > 0) {
        stats.push({
          color: i,
          count: parseInt(counts[i]!)
        });
      }
    }
    
    return stats.sort((a, b) => b.count - a.count);
  }

  // Combined stats for dashboard
  static async getDashboardStats(): Promise<{
    topUsers: Array<{userId: string, score: number}>;
    dailyVisitors: number;
    hourlyVisitors: number;
    recentActivity: Array<{id: string, userId: string, x: number, y: number, color: number, timestamp: number}>;
    colorStats: Array<{color: number, count: number}>;
    totalPixelsPlaced: number;
  }> {
    const [topUsers, dailyVisitors, hourlyVisitors, recentActivity, colorStats] = await Promise.all([
      this.getTopUsers(10),
      this.getUniqueVisitorCount('daily'),
      this.getUniqueVisitorCount('hourly'),
      this.getRecentActivity(20),
      this.getColorUsageStats()
    ]);

    // Calculate total pixels from leaderboard
    const totalPixelsPlaced = topUsers.reduce((sum, user) => sum + user.score, 0);

    return {
      topUsers,
      dailyVisitors,
      hourlyVisitors,
      recentActivity,
      colorStats,
      totalPixelsPlaced
    };
  }
}