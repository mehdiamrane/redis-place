import { useEffect, useRef } from "react";
import styled from "styled-components";
import { theme } from "../../styles/theme";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  maxWidth?: string;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndex.modal};
`;

const ModalContent = styled.div<{ $maxWidth?: string }>`
  background-color: white;
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.lg};
  width: 500px;
  max-width: ${(props) => props.$maxWidth || "90vw"};
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModalHeader = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.lg};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${theme.colors.dark};
  font-size: ${theme.fontSize.xl};
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: ${theme.colors.gray};
  padding: 8px;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
    color: ${theme.colors.dark};
    transform: scale(1.05);
  }
`;

const ModalBody = styled.div`
  color: ${theme.colors.dark};
`;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, showCloseButton = true, maxWidth }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus first input when modal opens (separate effect to avoid refocusing during typing)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector("input") as HTMLElement;
        firstInput?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Trap focus within the modal
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle specific keys, let input fields handle their own typing
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent ref={modalRef} $maxWidth={maxWidth} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        {(title || showCloseButton) && (
          <ModalHeader>
            {title && <ModalTitle>{title}</ModalTitle>}
            {showCloseButton && <CloseButton onClick={onClose}>✕</CloseButton>}
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};
