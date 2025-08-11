import React from "react";
import styled from "styled-components";
import { LuCircleAlert } from "react-icons/lu";
import { Modal, Button } from "./ui";
import { theme } from "../styles/theme";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const ErrorModalContent = styled.div`
  text-align: center;
  padding: ${theme.spacing.lg};
`;

const ErrorMessage = styled.p`
  color: ${theme.colors.danger};
  font-size: ${theme.fontSize.lg};
  font-weight: 500;
  margin: 0 0 ${theme.spacing.lg} 0;
  line-height: 1.5;
`;

const ErrorIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.warning};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.lg};
`;

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, message, title = "Error" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <ErrorModalContent>
        <ErrorIcon>
          <LuCircleAlert size={48} />
        </ErrorIcon>
        <ErrorMessage>{message}</ErrorMessage>
        <ButtonContainer>
          <Button variant="primary" size="large" onClick={onClose}>
            Got it!
          </Button>
        </ButtonContainer>
      </ErrorModalContent>
    </Modal>
  );
};

export default ErrorModal;
