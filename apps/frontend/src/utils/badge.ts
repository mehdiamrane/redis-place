export const getBadgeTitle = (badgeId: string): string => {
  const titles: Record<string, string> = {
    'first_pixel': 'First Steps',
    'pixel_explorer': 'Pixel Explorer', 
    'pixel_artist': 'Pixel Artist',
    'pixel_master': 'Pixel Master',
    'canvas_legend': 'Canvas Legend',
    'color_explorer': 'Color Explorer',
    'rainbow_master': 'Rainbow Master',
    'color_dedicated': 'Color Dedicated'
  };
  return titles[badgeId] || badgeId;
};

export const getBadgeEmoji = (badgeId: string): string => {
  const emojis: Record<string, string> = {
    'first_pixel': '🎯',
    'pixel_explorer': '🗺️',
    'pixel_artist': '🎨',
    'pixel_master': '👑', 
    'canvas_legend': '🏆',
    'color_explorer': '🌈',
    'rainbow_master': '🦄',
    'color_dedicated': '💎'
  };
  return emojis[badgeId] || '🏅';
};

export const getBadgeColor = (badgeId: string): string => {
  const colors: Record<string, string> = {
    'first_pixel': '#4CAF50',
    'pixel_explorer': '#2196F3',
    'pixel_artist': '#FF9800',
    'pixel_master': '#9C27B0',
    'canvas_legend': '#F44336', 
    'color_explorer': '#00BCD4',
    'rainbow_master': '#E91E63',
    'color_dedicated': '#795548'
  };
  return colors[badgeId] || '#666';
};