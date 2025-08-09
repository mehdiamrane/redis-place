import { useState } from 'react';
import AuthService from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, message, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = isLogin 
        ? await AuthService.login(username, password)
        : await AuthService.register(username, password);

      if (result.success) {
        onAuthSuccess();
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setUsername('');
    setPassword('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          {message && (
            <p style={{ 
              color: '#666', 
              margin: '10px 0',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}>
              {message}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold' }}>
              Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2196F3',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>

        {!isLogin && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '5px',
            border: '1px solid #c8e6c8',
            fontSize: '14px',
            color: '#2e7d2e'
          }}>
            <strong>Account Requirements:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Username: 3-20 characters, letters/numbers/underscores only</li>
              <li>Password: At least 6 characters</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}