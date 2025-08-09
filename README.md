# Redis Place

A collaborative pixel art canvas inspired by Reddit's r/place, built with React, Node.js, and Redis. Users can place colored pixels on a shared 1000x1000 canvas with real-time updates.

## 🎨 Features

- **Interactive Canvas**: 1000x1000 pixel canvas with zoom and pan functionality
- **Real-time Collaboration**: See other users' pixel placements in real-time via WebSocket
- **Color Palette**: 16 selected colors with keyboard shortcuts
- **Cooldown System**: 5-second cooldown between pixel placements
- **Keyboard Navigation**: Arrow keys for cursor movement, SPACE to select pixels
- **Persistent Storage**: All pixel data stored in Redis with efficient snapshot system

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

This project demonstrates several advanced Redis features and patterns:

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

### 5. **Key Existence Checks** (`EXISTS`)

- **Purpose**: Initialize canvas bitfield only if it doesn't exist
- **Usage**: Prevent overwriting existing canvas data on server restart
- **Pattern**: Conditional initialization

### 6. **Key Deletion** (`DEL`)

- **Purpose**: Clear corrupted or test data
- **Keys**: `canvas:pixels`, `canvas:snapshot`, `canvas:placed`
- **Use Case**: Development utilities and data migration

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

### Pixel Storage

- **1M pixels** stored in a single Redis bitfield
- **4 bits per pixel** (16 possible colors: 0-15)
- **Bit offset calculation**: `pixelIndex * 4` where `pixelIndex = y * 1000 + x`
- **Memory usage**: ~500KB for full canvas vs ~4MB with individual keys

### Snapshot Generation

1. Retrieve placed pixel coordinates from set: `SMEMBERS canvas:placed`
2. For each coordinate, get color: `BITFIELD GET u4 <offset>`
3. Filter out empty pixels (color = 0)
4. Serialize to JSON and cache: `SET canvas:snapshot <json>`

### Real-time Updates

1. Client places pixel → WebSocket message to server
2. Server validates and stores in Redis bitfield
3. Server publishes update: `PUBLISH canvas:updates <pixel_data>`
4. Subscriber receives and broadcasts to all clients via Socket.io

## 🚀 Getting Started

1. **Install Redis** (required)
2. **Install dependencies**: `npm install`
3. **Start development**: `npm run dev`
   - Backend runs on `http://localhost:3001`
   - Frontend runs on `http://localhost:5173`

## 🎮 Controls

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

- **Efficient Storage**: Bitfields reduce memory usage compared to regular key-per-pixel approach
- **Sparse Loading**: Only load pixels that have been placed
- **Cached Snapshots**: Pre-computed JSON snapshots for instant loading
- **Async Regeneration**: Non-blocking snapshot updates
- **Real-time Pub/Sub**: Instant updates without polling

This project showcases Redis as more than just a cache - it's a powerful database perfect for real-time collaborative applications.
