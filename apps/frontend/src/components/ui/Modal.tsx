import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  maxWidth?: string;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.colors.lightOverlay};
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndex.modal};
`;

const ModalContent = styled.div<{ maxWidth?: string }>`
  background-color: ${theme.colors.white};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.xxl};
  width: 400px;
  max-width: ${props => props.maxWidth || '90vw'};
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${theme.colors.dark};
  font-size: ${theme.fontSize.xl};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${theme.fontSize.lg};
  cursor: pointer;
  color: ${theme.colors.gray};
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.sm};
  
  &:hover {
    background-color: ${theme.colors.lightestGray};
  }
`;

const ModalBody = styled.div`
  color: ${theme.colors.dark};
`;

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  showCloseButton = true,
  maxWidth 
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent maxWidth={maxWidth} onClick={(e) => e.stopPropagation()}>
        {(title || showCloseButton) && (
          <ModalHeader>
            {title && <ModalTitle>{title}</ModalTitle>}
            {showCloseButton && (
              <CloseButton onClick={onClose}>
                ✕
              </CloseButton>
            )}
          </ModalHeader>
        )}
        <ModalBody>
          {children}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};