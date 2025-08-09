interface AuthResponse {
  sessionToken: string;
  username: string;
}

interface AuthError {
  error: string;
}

export class AuthService {
  private static readonly STORAGE_KEY = 'redis-place-auth';
  
  static getStoredAuth(): { sessionToken: string; username: string } | null {    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing stored auth:', error);
      this.clearStoredAuth();
    }
    return null;
  }
  
  static setStoredAuth(sessionToken: string, username: string): void {
    const authData = { sessionToken, username };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
  }
  
  static clearStoredAuth(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  static isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }
  
  static getSessionToken(): string | null {
    const auth = this.getStoredAuth();
    return auth?.sessionToken || null;
  }
  
  static getUsername(): string | null {
    const auth = this.getStoredAuth();
    return auth?.username || null;
  }
  
  static async register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data: AuthResponse | AuthError = await response.json();
      
      if (response.ok && 'sessionToken' in data) {
        this.setStoredAuth(data.sessionToken, data.username);
        return { success: true };
      } else if ('error' in data) {
        return { success: false, error: data.error };
      } else {
        return { success: false, error: 'Unknown error occurred' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }
  
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data: AuthResponse | AuthError = await response.json();
      
      if (response.ok && 'sessionToken' in data) {
        this.setStoredAuth(data.sessionToken, data.username);
        return { success: true };
      } else if ('error' in data) {
        return { success: false, error: data.error };
      } else {
        return { success: false, error: 'Unknown error occurred' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }
  
  static async logout(): Promise<void> {
    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      try {
        await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.clearStoredAuth();
  }
  
  static async verifyAuth(): Promise<{ valid: boolean; username?: string }> {
    const sessionToken = this.getSessionToken();
    if (!sessionToken) {
      return { valid: false };
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { valid: true, username: data.username };
      } else {
        this.clearStoredAuth();
        return { valid: false };
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      return { valid: false };
    }
  }
}

export default AuthService;