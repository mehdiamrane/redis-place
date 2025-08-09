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

### 7. **Streams** (`XADD`/`XREVRANGE`)

- **Purpose**: Activity feed and event sourcing
- **Key**: `stream:activity`
- **Commands Used**:
  - `XADD stream:activity * userId <id> x <x> y <y> color <color>` - Add activity
  - `XREVRANGE stream:activity + - COUNT 20` - Get recent activity
- **Benefits**: Append-only log with automatic ID generation and time ordering

### 8. **Hashes** (`HMSET`/`HMGET`/`HINCRBY`)

- **Purpose**: User profiles and complex data structures
- **Key Pattern**: `user:profile:<user_id>`
- **Fields**: `pixelsPlaced`, `favoriteColor`, `firstPixelTime`, `lastPixelTime`, `color_0`, `color_1`, etc.
- **Commands Used**:
  - `HINCRBY user:profile:<id> pixelsPlaced 1` - Increment pixel count
  - `HINCRBY user:profile:<id> color_5 1` - Track individual color usage
  - `HGETALL user:profile:<id>` - Get complete user profile with color breakdown
- **Benefits**: All user data in single hash, efficient color tracking, automatic favorite color calculation

### 9. **String Counters** (`INCR`/`MGET`)

- **Purpose**: Color usage statistics
- **Key Pattern**: `stats:color:<color_index>`
- **Commands Used**:
  - `INCR stats:color:5` - Increment color usage
  - `MGET stats:color:0 stats:color:1 ... stats:color:15` - Get all color stats
- **Benefits**: Atomic increments, batch retrieval for statistics

### 10. **Key Existence & Management** (`EXISTS`/`DEL`)

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
- **User Profiles**: Hash maps with embedded color tracking (`user:profile:*` with `color_N` fields)
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
   - Update user profile: `HINCRBY user:profile:<id> pixelsPlaced 1`
   - Track user color usage: `HINCRBY user:profile:<id> color_<N> 1`
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

## 📈 API Endpoints

### Canvas

- `GET /api/canvas` - Get current canvas snapshot
- `GET /api/health` - Health check endpoint

### Analytics

- `GET /api/stats` - Complete dashboard statistics
- `GET /api/leaderboard?limit=N` - Top user leaderboard
- `GET /api/activity?count=N` - Recent activity feed
- `GET /api/user/:userId` - Individual user profile and rank

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
