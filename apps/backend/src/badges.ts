import redis from './redis';

// Initialize badges data if it doesn't exist in Redis
export async function initializeBadges() {
  try {
    const exists = await redis.call('JSON.GET', 'badges', '$') as string | null;
    if (!exists || exists === 'null') {
      const defaultBadges = {
        badges: [
          {
            id: "first_pixel",
            title: "First Steps",
            description: "Placed your very first pixel on the canvas",
            imageUrl: "#",
            obtainMethod: "Place your first pixel"
          },
          {
            id: "pixel_explorer",
            title: "Pixel Explorer",
            description: "Placed 10 pixels on the canvas",
            imageUrl: "#",
            obtainMethod: "Place 10 pixels"
          },
          {
            id: "pixel_artist",
            title: "Pixel Artist",
            description: "Placed 50 pixels on the canvas",
            imageUrl: "#",
            obtainMethod: "Place 50 pixels"
          },
          {
            id: "pixel_master",
            title: "Pixel Master",
            description: "Placed 100 pixels on the canvas",
            imageUrl: "#",
            obtainMethod: "Place 100 pixels"
          },
          {
            id: "canvas_legend",
            title: "Canvas Legend",
            description: "Placed 500 pixels on the canvas",
            imageUrl: "#",
            obtainMethod: "Place 500 pixels"
          },
          {
            id: "color_explorer",
            title: "Color Explorer",
            description: "Used 5 or more different colors",
            imageUrl: "#",
            obtainMethod: "Use 5 different colors"
          },
          {
            id: "rainbow_master",
            title: "Rainbow Master",
            description: "Used 10 or more different colors",
            imageUrl: "#",
            obtainMethod: "Use 10 different colors"
          },
          {
            id: "color_dedicated",
            title: "Color Dedicated",
            description: "Placed 25 or more pixels with the same color",
            imageUrl: "#",
            obtainMethod: "Place 25+ pixels with the same color"
          }
        ],
        totalCount: 8,
        lastUpdated: Date.now()
      };
      
      await redis.call('JSON.SET', 'badges', '$', JSON.stringify(defaultBadges));
      console.log('Initialized default badges data in Redis');
    }
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
}