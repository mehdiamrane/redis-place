import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface InputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.dark};
  font-weight: bold;
  font-size: ${theme.fontSize.base};
`;

const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 2px solid ${props => props.hasError ? theme.colors.danger : theme.colors.gray};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.lg};
  box-sizing: border-box;
  transition: border-color ${theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? theme.colors.danger : theme.colors.secondary};
  }
  
  &::placeholder {
    color: ${theme.colors.lightGray};
  }
`;

const ErrorMessage = styled.div`
  color: ${theme.colors.danger};
  background-color: ${theme.colors.errorBackground};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.xs};
  border: 1px solid ${theme.colors.errorBorder};
  font-size: ${theme.fontSize.md};
`;

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  fullWidth = true,
  ...inputProps 
}) => {
  return (
    <InputContainer fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      <StyledInput hasError={!!error} {...inputProps} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputContainer>
  );
};