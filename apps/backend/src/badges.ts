import redis from "./redis";

// Initialize badges data if it doesn't exist in Redis
export async function initializeBadges() {
  try {
    const exists = (await redis.call("JSON.GET", "badges", "$")) as string | null;
    if (!exists || exists === "null") {
      const defaultBadges = {
        badges: [
          {
            id: "first_pixel",
            title: "First Steps",
            description: "Congratulations! You successfully clicked on a thing. Your parents would be so proud.",
            obtainMethod: "Place your first pixel",
          },
          {
            id: "pixel_explorer",
            title: "Pixel Explorer",
            description: "You've discovered that clicking is addictive. Welcome to your new obsession.",
            obtainMethod: "Place 10 pixels",
          },
          {
            id: "pixel_artist",
            title: "Pixel Artist",
            description: "At this point, you're basically the Picasso of tiny squares. Time to update your LinkedIn.",
            obtainMethod: "Place 50 pixels",
          },
          {
            id: "pixel_master",
            title: "Pixel Master",
            description: "100 pixels later and you're still here. Maybe it's time to question your life choices.",
            obtainMethod: "Place 100 pixels",
          },
          {
            id: "canvas_legend",
            title: "Canvas Legend",
            description: "500 pixels?! Do you even remember what sunlight looks like? Touch grass immediately.",
            obtainMethod: "Place 500 pixels",
          },
          {
            id: "color_explorer",
            title: "Color Explorer",
            description: "Wow, you discovered there are other colors besides blue! Revolutionary thinking right there.",
            obtainMethod: "Use 5 different colors",
          },
          {
            id: "rainbow_master",
            title: "Rainbow Master",
            description: "You've used more colors than a unicorn's sneeze. Taste the rainbow, become the rainbow.",
            obtainMethod: "Use 10 different colors",
          },
          {
            id: "color_dedicated",
            title: "Color Dedicated",
            description:
              "Committed to one color like it's your high school sweetheart. Loyalty or lack of imagination?",
            obtainMethod: "Place 25+ pixels with the same color",
          },
        ],
        totalCount: 8,
        lastUpdated: Date.now(),
      };

      await redis.call("JSON.SET", "badges", "$", JSON.stringify(defaultBadges));
      console.log("Initialized default badges data in Redis");
    }
  } catch (error) {
    console.error("Error initializing badges:", error);
  }
}
