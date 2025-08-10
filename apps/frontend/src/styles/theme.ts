export const theme = {
  colors: {
    primary: '#4CAF50',
    primaryHover: '#45a049',
    secondary: '#2196F3',
    secondaryHover: '#0056b3',
    danger: '#dc3545',
    dangerHover: '#c82333',
    warning: '#ff9800',
    warningHover: '#f57c00',
    info: '#17a2b8',
    infoHover: '#138496',
    success: '#28a745',
    successHover: '#218838',
    purple: '#6f42c1',
    purpleHover: '#5a32a3',
    orange: '#fd7e14',
    orangeHover: '#e8650e',
    
    // Grayscale
    dark: '#333',
    darkGray: '#495057',
    gray: '#666',
    lightGray: '#999',
    lighterGray: '#ccc',
    lightestGray: '#f5f5f5',
    white: '#fff',
    
    // Overlays & backgrounds
    overlay: 'rgba(0, 0, 0, 0.8)',
    lightOverlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: 'rgba(0, 0, 0, 0.9)',
    hudBackground: 'rgba(0, 0, 0, 0.85)',
    cardBackground: '#2a2a2a',
    cardBackgroundLight: '#3a3a3a',
    
    // Status colors
    connected: '#4CAF50',
    connecting: '#FF9800',
    disconnected: '#f44336',
    
    // Special backgrounds
    errorBackground: '#ffebee',
    errorBorder: '#ffcdd2',
    successBackground: '#e8f5e8',
    successBorder: '#c8e6c8',
    infoBackground: '#f5f5f5',
    infoBorder: '#ddd',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  borderRadius: {
    sm: '3px',
    md: '5px',
    lg: '6px',
    xl: '8px',
    xxl: '10px',
    round: '50%',
    pill: '20px',
  },
  
  fontSize: {
    xs: '9px',
    sm: '11px',
    md: '12px',
    base: '14px',
    lg: '16px',
    xl: '24px',
  },
  
  zIndex: {
    base: 1,
    nav: 1000,
    modal: 2000,
  },
  
  transitions: {
    fast: '0.2s',
    normal: '0.3s',
  },
} as const;

export type Theme = typeof theme;