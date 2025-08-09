import redis from './redis';

interface UserProfile {
  pixelsPlaced: number;
  favoriteColor: number | null;
  firstPixelTime: number | null;
  lastPixelTime: number | null;
  colorUsage: Record<string, number>;
  badges: string[];
}

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
      'timestamp', (data.timestamp || Date.now()).toString(),
      'type', 'pixel'
    );
  }

  static async addBadgeActivity(userId: string, badgeId: string): Promise<void> {
    await redis.xadd(
      this.ACTIVITY_STREAM_KEY,
      '*', // Auto-generate ID
      'userId', userId,
      'badgeId', badgeId,
      'timestamp', Date.now().toString(),
      'type', 'badge'
    );
  }

  static async getRecentActivity(count: number = 50): Promise<Array<{
    id: string;
    userId: string;
    type: 'pixel' | 'badge';
    timestamp: number;
    x?: number;
    y?: number;
    color?: number;
    badgeId?: string;
  }>> {
    const results = await redis.xrevrange(this.ACTIVITY_STREAM_KEY, '+', '-', 'COUNT', count);
    
    return results.map(([id, fields]) => {
      const data: any = { id };
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }
      
      const activity: any = {
        id: data.id,
        userId: data.userId,
        type: data.type || 'pixel', // Default to pixel for backward compatibility
        timestamp: parseInt(data.timestamp)
      };

      if (activity.type === 'pixel') {
        activity.x = parseInt(data.x);
        activity.y = parseInt(data.y);
        activity.color = parseInt(data.color);
      } else if (activity.type === 'badge') {
        activity.badgeId = data.badgeId;
      }

      return activity;
    });
  }

  // User Profiles (JSON-based)

  static async updateUserProfile(userId: string, data: {
    pixelsPlaced?: number;
    colorUsed?: number;
    firstPixelTime?: number;
    lastPixelTime?: number;
    badgesToAdd?: string[];
  }): Promise<void> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    
    // Get existing profile or create new one
    let profile: UserProfile;
    try {
      const existingProfile = await redis.call('JSON.GET', key, '$') as string | null;
      if (existingProfile && existingProfile !== 'null') {
        profile = JSON.parse(existingProfile)[0];
      } else {
        profile = {
          pixelsPlaced: 0,
          favoriteColor: null,
          firstPixelTime: null,
          lastPixelTime: null,
          colorUsage: {},
          badges: []
        };
      }
    } catch (error) {
      // Profile doesn't exist, create new one
      profile = {
        pixelsPlaced: 0,
        favoriteColor: null,
        firstPixelTime: null,
        lastPixelTime: null,
        colorUsage: {},
        badges: []
      };
    }

    // Update profile data
    if (data.pixelsPlaced !== undefined) {
      profile.pixelsPlaced += data.pixelsPlaced;
    }

    if (data.colorUsed !== undefined) {
      // Ensure colorUsage is initialized as an object
      if (!profile.colorUsage || typeof profile.colorUsage !== 'object') {
        profile.colorUsage = {};
      }
      
      const colorKey = data.colorUsed.toString();
      profile.colorUsage[colorKey] = (profile.colorUsage[colorKey] || 0) + 1;
      
      // Recalculate favorite color
      let maxCount = 0;
      let favoriteColor = null;
      for (const [color, count] of Object.entries(profile.colorUsage)) {
        if (count > maxCount) {
          maxCount = count;
          favoriteColor = parseInt(color);
        }
      }
      profile.favoriteColor = favoriteColor;
    }

    if (data.firstPixelTime !== undefined && profile.firstPixelTime === null) {
      profile.firstPixelTime = data.firstPixelTime;
    }

    if (data.lastPixelTime !== undefined) {
      profile.lastPixelTime = data.lastPixelTime;
    }

    if (data.badgesToAdd && data.badgesToAdd.length > 0) {
      for (const badge of data.badgesToAdd) {
        if (!profile.badges.includes(badge)) {
          profile.badges.push(badge);
        }
      }
    }

    // Save updated profile atomically
    await redis.call('JSON.SET', key, '$', JSON.stringify(profile));
  }

  static async getUserProfile(userId: string): Promise<{
    pixelsPlaced: number;
    favoriteColor: number | null;
    firstPixelTime: number | null;
    lastPixelTime: number | null;
    colorUsage: Array<{color: number, count: number}>;
    badges: string[];
  } | null> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    
    try {
      const profileData = await redis.call('JSON.GET', key, '$') as string | null;
      if (!profileData || profileData === 'null') {
        return null;
      }

      const profileArray = JSON.parse(profileData);
      // Handle double array wrapping from consolidation + JSON.GET path $
      let profile: UserProfile;
      if (Array.isArray(profileArray) && Array.isArray(profileArray[0])) {
        profile = profileArray[0][0]; // [[{profile}]] -> {profile}
      } else if (Array.isArray(profileArray)) {
        profile = profileArray[0]; // [{profile}] -> {profile}
      } else {
        profile = profileArray; // {profile} -> {profile}
      }
      
      // Convert colorUsage object to array format
      const colorUsage: Array<{color: number, count: number}> = [];
      if (profile.colorUsage && typeof profile.colorUsage === 'object') {
        for (const [color, count] of Object.entries(profile.colorUsage)) {
          if (count > 0) {
            colorUsage.push({ color: parseInt(color), count });
          }
        }
      }
      
      // Sort by usage count (most used first)
      colorUsage.sort((a, b) => b.count - a.count);

      return {
        pixelsPlaced: profile.pixelsPlaced || 0,
        favoriteColor: profile.favoriteColor || null,
        firstPixelTime: profile.firstPixelTime || null,
        lastPixelTime: profile.lastPixelTime || null,
        colorUsage,
        badges: profile.badges || []
      };
    } catch (error) {
      console.error('Error getting JSON profile:', error);
      return null;
    }
  }

  static async incrementUserPixelCount(userId: string): Promise<number> {
    const key = `${this.USER_PROFILE_KEY_PREFIX}${userId}`;
    
    try {
      // Try to increment existing pixelsPlaced field
      const result = await redis.call('JSON.NUMINCRBY', key, '$.pixelsPlaced', 1) as number[];
      return result[0];
    } catch (error) {
      // Profile doesn't exist, create it with pixelsPlaced = 1
      await this.updateUserProfile(userId, { pixelsPlaced: 1 });
      return 1;
    }
  }

  static async trackUserColorUsage(userId: string, color: number): Promise<void> {
    const now = Date.now();
    await this.updateUserProfile(userId, {
      colorUsed: color,
      lastPixelTime: now
    });
  }

  // Badge Management
  static async addUserBadge(userId: string, badge: string): Promise<void> {
    await this.updateUserProfile(userId, { badgesToAdd: [badge] });
  }

  static async addUserBadges(userId: string, badges: string[]): Promise<void> {
    await this.updateUserProfile(userId, { badgesToAdd: badges });
  }

  static async getUserBadges(userId: string): Promise<string[]> {
    const profile = await this.getUserProfile(userId);
    return profile?.badges || [];
  }

  // Badge Achievement Logic
  static async checkAndAwardBadges(userId: string, pixelCount: number, colorUsage: Record<string, number>): Promise<void> {
    const currentBadges = await this.getUserBadges(userId);
    const badges: string[] = [];
    
    // First pixel badge
    if (pixelCount >= 1 && !currentBadges.includes('first_pixel')) {
      badges.push('first_pixel');
    }
    
    // Milestone badges
    if (pixelCount >= 10 && !currentBadges.includes('pixel_explorer')) {
      badges.push('pixel_explorer'); // 10 pixels
    }
    if (pixelCount >= 50 && !currentBadges.includes('pixel_artist')) {
      badges.push('pixel_artist'); // 50 pixels
    }
    if (pixelCount >= 100 && !currentBadges.includes('pixel_master')) {
      badges.push('pixel_master'); // 100 pixels
    }
    if (pixelCount >= 500 && !currentBadges.includes('canvas_legend')) {
      badges.push('canvas_legend'); // 500 pixels
    }
    
    // Color variety badges
    const colorsUsed = Object.keys(colorUsage).length;
    if (colorsUsed >= 5 && !currentBadges.includes('color_explorer')) {
      badges.push('color_explorer'); // Used 5+ colors
    }
    if (colorsUsed >= 10 && !currentBadges.includes('rainbow_master')) {
      badges.push('rainbow_master'); // Used 10+ colors
    }
    
    // Color dedication badges (single color focus)
    if (Object.keys(colorUsage).length > 0) {
      const maxColorUsage = Math.max(...Object.values(colorUsage));
      if (maxColorUsage >= 25 && !currentBadges.includes('color_dedicated')) {
        badges.push('color_dedicated'); // 25+ pixels of same color
      }
    }
    
    if (badges.length > 0) {
      await this.addUserBadges(userId, badges);
      console.log(`Awarded badges to ${userId}:`, badges);
      
      // Add badge achievements to activity stream
      for (const badge of badges) {
        await this.addBadgeActivity(userId, badge);
      }
    }
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
    recentActivity: Array<{
      id: string;
      userId: string;
      type: 'pixel' | 'badge';
      timestamp: number;
      x?: number;
      y?: number;
      color?: number;
      badgeId?: string;
    }>;
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