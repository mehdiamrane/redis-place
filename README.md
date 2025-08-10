# Redis Place

A collaborative pixel art canvas inspired by Reddit's r/place, built with React, Node.js, and Redis. Users can place colored pixels on a shared 1000x1000 canvas with real-time updates.

## 🎨 Features

### Canvas & Interaction

- **Interactive Canvas**: 1000x1000 pixel canvas with zoom and pan functionality
- **Real-time Collaboration**: See other users' pixel placements in real-time via WebSocket
- **Color Palette**: 16 selected colors with keyboard shortcuts
- **Cooldown System**: 5-second cooldown between pixel placements
- **Keyboard Navigation**: Arrow keys for cursor movement, SPACE to select pixels
- **Persistent Users**: User IDs persist across browser sessions using localStorage

### Analytics Dashboard

- **Real-time Analytics**: Live dashboard showing canvas activity and user statistics
- **User Leaderboards**: Top contributors ranked by pixels placed (all-time)
- **Unique Visitor Tracking**: Daily and hourly unique visitor counts using probabilistic algorithms
- **Activity Feed**: Live stream of recent pixel placements
- **Color Statistics**: Most popular colors with usage counts
- **User Profiles**: Individual user statistics including pixels placed, favorite colors, and activity times

### Canvas Heatmap

- **Activity Heatmap Overlay**: Visual overlay showing activity hot zones across the canvas
- **Multiple Time Ranges**: View activity patterns for 1 hour, 6 hours, 24 hours, or 7 days
- **Color-Coded Intensity**: Blue (cold) to red (hot) gradient showing pixel placement frequency
- **Real-time Tracking**: Every pixel placement is tracked in 50x50 pixel zones using Redis Time Series
- **High Performance**: Multi-layer optimization with Redis pipelines and caching - reduced from 30s to 180ms (pipelines) to 90ms (cache hits)

### Canvas Replay System

- **Historical Timeline Playbook**: Watch the canvas evolve over time from the very first pixel
- **Date Range Filtering**: Load events by selecting specific start and end timestamps (up to 30-day range)
- **Quick Time Presets**: One-click buttons for common time ranges (1h, 6h, 24h, 7d)
- **Timeline Controls**: Play/pause, step forward/backward, adjustable playback speeds (0.5x to 10x)
- **Event Filtering**: Automatically filters pixel placement events from the activity stream
- **Chronological Reconstruction**: Builds canvas state progressively, showing pixel overwrites and evolution
- **Native Redis Filtering**: Uses Redis Streams' time-based filtering (`XRANGE`) for optimal performance
- **Interactive UI**: DateTime inputs with validation, loading states, and comprehensive error handling

### Pixel Info System (Smart Pixel History)

- **Intelligent Query Optimization**: Only searches activity stream for pixels that have color (skips empty pixels)
- **Progressive Search Algorithm**: Uses 10k event batches with 7-day time windows for efficient historical lookup
- **Permanent HUD Display**: Always-visible info panel showing last pixel placement details
- **Real-time Updates**: Instantly shows pixel information as you navigate the canvas
- **Last Placement Focus**: Shows most recent placement with user, timestamp, and color information
- **Performance Optimized**: Avoids unnecessary database queries for empty pixels (Color 0)
- **Search Progress Feedback**: Visual indicators showing search attempts and progress through historical data

### Data Storage

- **Persistent Storage**: All pixel data stored in Redis with efficient snapshot system
- **Advanced Analytics**: Multiple Redis data structures for comprehensive analytics

## 🏗 Architecture

This project uses a modern monorepo structure:

```
redis-place/
├── apps/
│   ├── backend/          # Node.js + Express + Socket.io server
│   └── frontend/         # React + Vite application
├── packages/
│   └── shared/           # Shared color utilities and constants
└── package.json          # Workspace configuration
```

## 🔴 Redis Features Used

This project demonstrates multiple advanced Redis features and patterns:

### 1. **Bitfields** (`BITFIELD`)

- **Purpose**: Efficient storage of pixel colors (4 bits per pixel)
- **Implementation**: Each pixel color (0-15) is stored as a 4-bit unsigned integer
- **Key**: `canvas:pixels`
- **Commands Used**:
  - `BITFIELD canvas:pixels SET u4 <bit_offset> <color_value>`
  - `BITFIELD canvas:pixels GET u4 <bit_offset>`
- **Efficiency**: Stores 1M pixels in ~500KB vs 4MB with traditional key-per-pixel approach
- **Design Choice**: 16 colors chosen for storage optimization (4 bits per pixel). Redis easily supports more colors (e.g., u8 for 256 colors) but would double memory usage.

### 2. **Pub/Sub** (`PUBLISH`/`SUBSCRIBE`)

- **Purpose**: Real-time pixel update notifications across WebSocket connections
- **Channel**: `canvas:updates`
- **Flow**:
  1. User places pixel → Server updates Redis → Server publishes update
  2. Redis subscriber receives update → Broadcasts to all connected clients
- **Benefits**: Decouples pixel storage from real-time notifications

### 3. **Sets** (`SADD`/`SMEMBERS`)

- **Purpose**: Track which pixels have been placed for efficient snapshot generation
- **Key**: `canvas:placed`
- **Usage**: Stores coordinate strings like `"100:200"` for each placed pixel
- **Optimization**: Only iterate through placed pixels (sparse) vs scanning entire canvas

### 4. **String Storage** (`SET`/`GET`)

- **Purpose**: Cache pre-computed canvas snapshots for fast client loading
- **Key**: `canvas:snapshot`
- **Content**: JSON snapshot with pixel data, timestamp, and dimensions
- **Pattern**: Cache invalidation with async regeneration

### 5. **Sorted Sets** (`ZADD`/`ZINCRBY`/`ZREVRANGE`)

- **Purpose**: User leaderboards and rankings
- **Key**: `leaderboard:users`
- **Commands Used**:
  - `ZINCRBY leaderboard:users 1 <user_id>` - Increment user score
  - `ZREVRANGE leaderboard:users 0 9 WITHSCORES` - Get top 10 users
  - `ZREVRANK leaderboard:users <user_id>` - Get user rank
- **Benefits**: Automatic sorting and efficient range queries for leaderboards

### 6. **HyperLogLog** (`PFADD`/`PFCOUNT`)

- **Purpose**: Unique visitor counting with minimal memory usage
- **Keys**: `visitors:daily:YYYY-MM-DD`, `visitors:hourly:YYYY-MM-DDTHH`
- **Commands Used**:
  - `PFADD visitors:daily:2024-08-09 <user_id>` - Track daily visitor
  - `PFCOUNT visitors:daily:2024-08-09` - Count unique daily visitors
- **Benefits**: Probabilistic counting with ~1% error but constant memory usage
- **Efficiency**: Can count billions of unique items with only 12KB per key

### 7. **Streams** (`XADD`/`XREVRANGE`/`XRANGE`)

- **Purpose**: Activity feed, event sourcing, replay system, and pixel history tracking
- **Key**: `stream:activity`
- **Commands Used**:
  - `XADD stream:activity * userId <id> x <x> y <y> color <color> type pixel` - Add pixel placement activity
  - `XREVRANGE stream:activity + - COUNT 50` - Get recent activity for live feed
  - `XRANGE stream:activity - + COUNT 10000` - Get chronological events for replay system
  - `XREVRANGE stream:activity + -` - Get all events for pixel history filtering
- **Advanced Use Cases**:
  - **Canvas Replay**: Uses native Redis time-based filtering (`XRANGE startTime endTime`) for optimal performance, sorting events chronologically to reconstruct canvas evolution
  - **Pixel Info System**: Intelligent progressive search using `XREVRANGE` with 10k batches and 7-day time windows, only querying colored pixels to avoid unnecessary searches
  - **Event Filtering**: Uses `type` field to distinguish pixel placements from other activities (badges, etc.)
- **Benefits**: 
  - Append-only log with automatic ID generation and time ordering
  - Complete audit trail for every pixel placement with user attribution
  - Efficient chronological and reverse-chronological queries
  - Foundation for both replay functionality and individual pixel forensics

### 8. **Hashes** (`HMSET`/`HMGET`/`HINCRBY`)

- **Purpose**: User profiles and complex data structures
- **Key Pattern**: `userprofile:<user_id>`
- **Fields**: `pixelsPlaced`, `favoriteColor`, `firstPixelTime`, `lastPixelTime`, `color_0`, `color_1`, etc.
- **Commands Used**:
  - `HINCRBY userprofile:<id> pixelsPlaced 1` - Increment pixel count
  - `HINCRBY userprofile:<id> color_5 1` - Track individual color usage
  - `HGETALL userprofile:<id>` - Get complete user profile with color breakdown
- **Benefits**: All user data in single hash, efficient color tracking, automatic favorite color calculation

### 9. **String Counters** (`INCR`/`MGET`)

- **Purpose**: Color usage statistics
- **Key Pattern**: `stats:color:<color_index>`
- **Commands Used**:
  - `INCR stats:color:5` - Increment color usage
  - `MGET stats:color:0 stats:color:1 ... stats:color:15` - Get all color stats
- **Benefits**: Atomic increments, batch retrieval for statistics

### 10. **Time Series** (`TS.CREATE`/`TS.ADD`/`TS.RANGE`)

- **Purpose**: Activity heatmap tracking with time-based aggregation
- **Key Pattern**: `heatmap:<zone_x>:<zone_y>`
- **Implementation**:
  - **Zone Tracking**: 1000x1000 canvas divided into 50x50 pixel zones (20x20 grid)
  - **Data Collection**: Each pixel placement increments the corresponding zone's time series
  - **Retention**: 7-day data retention for time-based analysis
- **Commands Used**:
  - `TS.CREATE heatmap:0:0 RETENTION 604800000` - Create time series with 7-day retention
  - `TS.ADD heatmap:0:0 <timestamp> 1` - Add activity point to zone
  - `TS.RANGE heatmap:0:0 <from_time> +` - Query activity in time range
  - `SETEX heatmap:cache:24h 300 <json_data>` - Cache results for 5 minutes
  - `GET heatmap:cache:24h` - Retrieve cached heatmap data
- **Performance Optimization**:
  - **Challenge**: 400 sequential queries took ~30 seconds
  - **Solution**: Redis pipeline batches all queries into single round-trip
  - **Result**: Reduced query time to ~180ms (165x performance improvement)
  - **Cache Layer**: 5-minute Redis cache reduces repeated queries to ~90ms (additional 2x improvement)
- **Benefits**: Time-based activity analysis, efficient zone-based aggregation, high-performance bulk queries with intelligent caching

### 11. **Key Existence & Management** (`EXISTS`/`DEL`)

- **Purpose**: Initialize canvas, clear test data, conditional operations
- **Keys**: `canvas:pixels`, `canvas:snapshot`, `canvas:placed`, various analytics keys
- **Use Cases**: Development utilities, data migration, conditional initialization

## 🔧 Redis Configuration

The application connects to Redis using the `ioredis` library with these configurations:

```typescript
// Primary Redis client for data operations
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Dedicated subscriber client for pub/sub
const redisSubscriber = new Redis({
  // Same connection config...
});
```

## 📊 Data Storage Patterns

### Canvas Storage

- **1M pixels** stored in a single Redis bitfield
- **4 bits per pixel** (16 possible colors: 0-15)
- **Bit offset calculation**: `pixelIndex * 4` where `pixelIndex = y * 1000 + x`
- **Memory usage**: ~500KB for full canvas vs ~4MB with individual keys

### Analytics Storage

- **User Leaderboards**: Sorted sets with automatic ranking (`leaderboard:users`)
- **Unique Visitors**: HyperLogLog for memory-efficient counting (`visitors:daily:*`, `visitors:hourly:*`)
- **Activity Stream**: Redis Streams for ordered event log (`stream:activity`)
- **User Profiles**: Hash maps with embedded color tracking (`userprofile:*` with `color_N` fields)
- **Global Color Statistics**: Individual counters for each color (`stats:color:*`)

### Snapshot Generation

1. Retrieve placed pixel coordinates from set: `SMEMBERS canvas:placed`
2. For each coordinate, get color: `BITFIELD GET u4 <offset>`
3. Filter out empty pixels (color = 0)
4. Serialize to JSON and cache: `SET canvas:snapshot <json>`

### Real-time Updates & Analytics

1. Client places pixel → WebSocket message to server
2. Server validates and stores in Redis bitfield
3. **Analytics tracking** (all executed in parallel):
   - Increment user score: `ZINCRBY leaderboard:users 1 <user_id>`
   - Track unique visitor: `PFADD visitors:daily:<date> <user_id>`
   - Add to activity stream: `XADD stream:activity * userId <id> x <x> y <y>`
   - Update user profile: `HINCRBY userprofile:<id> pixelsPlaced 1`
   - Track user color usage: `HINCRBY userprofile:<id> color_<N> 1`
   - Increment global color stats: `INCR stats:color:<color>`
4. Server publishes update: `PUBLISH canvas:updates <pixel_data>`
5. Subscriber receives and broadcasts to all clients via Socket.io

## 🚀 Getting Started

1. **Install Redis** (required)
2. **Install dependencies**: `npm install`
3. **Start development**: `npm run dev`
   - Backend runs on `http://localhost:3001`
   - Frontend runs on `http://localhost:5173`
   - Analytics dashboard available at `http://localhost:5173/#analytics`
   - Canvas replay system available at `http://localhost:5173/#replay`
   - Badges page available at `http://localhost:5173/#badges`

## 🎮 Controls

### Canvas Navigation

- **Mouse**: Click to select pixels, pick a color and click paint to place
- **SPACE**: Select pixel under cursor
- **Arrow Keys**: Move cursor around canvas
- **1-9, 0, Q, W, E, R, T, Y**: Select colors (keyboard shortcuts)
- **Enter**: Place pixel with selected color
- **ESC**: Deselect pixel
- **Mouse Wheel**: Zoom in/out

## 🔧 Environment Variables

- Create a `.env` file in the backend directory with variables from the `backend/.env.example` file.
- Create a `.env` file in the frontend directory with variables from the `frontend/.env.example` file.

## 🏁 Performance Optimizations

### Canvas Performance

- **Efficient Storage**: Bitfields reduce memory usage compared to regular key-per-pixel approach
- **Sparse Loading**: Only load pixels that have been placed
- **Cached Snapshots**: Pre-computed JSON snapshots for instant loading
- **Async Regeneration**: Non-blocking snapshot updates
- **Real-time Pub/Sub**: Instant updates without polling

### Analytics Performance

- **Parallel Operations**: All analytics updates execute simultaneously using `Promise.all()`
- **Probabilistic Counting**: HyperLogLog provides accurate estimates with minimal memory
- **Efficient Rankings**: Sorted sets automatically maintain leaderboard order
- **Streaming Data**: Redis Streams provide append-only activity logs with automatic ordering
- **Batch Retrieval**: Color statistics fetched efficiently with `MGET`

### User Profile: Migrating from Hash to JSON

**Migration Rationale**: The user profile system is being migrated from Redis Hash to Redis JSON for improved performance and functionality.

**Current Hash Limitations:**

- **Inefficient Favorite Color Calculation**: Currently requires 4 operations per pixel placement:
  1. `HINCRBY userprofile:<id> color_<N> 1` - Increment color usage
  2. `HGETALL userprofile:<id>` - Retrieve entire profile to find max color
  3. Iterate through all `color_*` fields to find highest count
  4. `HSET userprofile:<id> favoriteColor <color>` - Update favorite color
- **Limited Data Structure Support**: Hash fields cannot store arrays (needed for badges)
- **Complex Field Parsing**: Converting `color_N` fields back to structured data
- **Poor Scalability**: More dynamic fields lead to increased parsing overhead

**JSON Benefits:**

- **Reduced Operations**: Only 3 operations needed:
  1. `JSON.GET userprofile:<id>` - Retrieve profile object
  2. Modify object in application memory (increment color, recalculate favorite, add badges)
  3. `JSON.SET userprofile:<id> $ <updated_object>` - Atomic update
- **Structured Data Support**: Native support for arrays and nested objects
  ```json
  {
    "pixelsPlaced": 150,
    "favoriteColor": 3,
    "colorUsage": { "0": 5, "3": 45, "7": 12 },
    "badges": ["first_pixel", "color_master", "streak_7days"],
    "firstPixelTime": 1628097234567,
    "lastPixelTime": 1628183634567
  }
  ```
- **Atomic Updates**: Single JSON.SET operation ensures data consistency
- **Cleaner Code Logic**: Direct object manipulation vs field name parsing
- **Better Performance**: Single JSON operation vs multiple hash operations
- **Future-Proof**: Easy expansion for more data types

## 📈 API Endpoints

### Canvas

- `GET /api/canvas` - Get current canvas snapshot
- `GET /api/health` - Health check endpoint

### Analytics

- `GET /api/stats` - Complete dashboard statistics
- `GET /api/leaderboard?limit=N` - Top user leaderboard
- `GET /api/activity?count=N` - Recent activity feed
- `GET /api/user/:userId` - Individual user profile and rank

### Replay & Pixel Info

- `GET /api/replay?start=timestamp&end=timestamp` - Date-range filtered pixel events for canvas replay (max 30-day range)
- `GET /api/pixel-info/:x/:y` - Smart pixel information with progressive search (only queries colored pixels)

## 🎯 Hackathon Features

This project demonstrates Redis capabilities across multiple data structures:

- **🔢 Bitfields** - Ultra-efficient pixel storage
- **📢 Pub/Sub** - Real-time event broadcasting
- **🏆 Sorted Sets** - Automatic leaderboards and rankings
- **📊 HyperLogLog** - Probabilistic unique visitor counting
- **📝 Streams** - Event sourcing and activity feeds
- **📋 Hashes** - Complex user profile storage
- **⚡ Sets** - Efficient pixel tracking
- **🔢 Strings** - Caching and counters

This project showcases Redis as more than just a cache - it's a comprehensive data platform perfect for real-time collaborative applications with advanced analytics.
