import { useState } from 'react';
import styled from 'styled-components';
import AuthService from '../services/authService';
import { Modal, Button, Input } from './ui';
import { theme } from '../styles/theme';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  onAuthSuccess: () => void;
}

const MessageBox = styled.div`
  color: ${theme.colors.gray};
  margin: ${theme.spacing.sm} 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.infoBackground};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.infoBorder};
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ToggleContainer = styled.div`
  text-align: center;
  margin-top: ${theme.spacing.lg};
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.secondary};
  text-decoration: underline;
  cursor: pointer;
  font-size: ${theme.fontSize.base};
  
  &:hover {
    color: ${theme.colors.secondaryHover};
  }
`;

const RequirementsBox = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.successBackground};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.successBorder};
  font-size: ${theme.fontSize.base};
  color: #2e7d2e;
  
  ul {
    margin: ${theme.spacing.xs} 0;
    padding-left: ${theme.spacing.lg};
  }
`;

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
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={isLogin ? 'Sign In' : 'Create Account'}
      showCloseButton={false}
    >
      {message && <MessageBox>{message}</MessageBox>}
      
      <FormContainer onSubmit={handleSubmit}>
        <Input
          label="Username:"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Username can only contain letters, numbers, and underscores"
          placeholder="Enter your username"
          error={error && error.includes('username') ? error : undefined}
        />
        
        <Input
          label="Password:"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Enter your password"
          error={error && !error.includes('username') ? error : undefined}
        />
        
        <ButtonGroup>
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
          <Button
            type="button"
            variant="gray"
            onClick={handleClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </FormContainer>
      
      <ToggleContainer>
        <ToggleButton
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
        >
          {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
        </ToggleButton>
      </ToggleContainer>
      
      {!isLogin && (
        <RequirementsBox>
          <strong>Account Requirements:</strong>
          <ul>
            <li>Username: 3-20 characters, letters/numbers/underscores only</li>
            <li>Password: At least 6 characters</li>
          </ul>
        </RequirementsBox>
      )}
    </Modal>
  );
}