import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { getAvailableColorIds, colorIdToHex } from "@redis-place/shared";
import { useCanvasStore, useAuthStore } from "../stores";
import { HUDPanel, HUDLabel, HUDValue, HUDSection, HUDGroup, Button } from "./ui";
import { theme } from "../styles/theme";

const ColorGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: ${theme.spacing.md};
  align-items: flex-start;
  max-width: 450px;
`;

const ColorRow = styled.div<{ itemCount: number }>`
  display: flex;
  gap: 8px;
  justify-content: flex-start;
`;

const ColorSwatch = styled.div<{
  color: string;
  selected: boolean;
  disabled: boolean;
  colorId: number;
}>`
  width: 38px;
  height: 38px;
  background-color: ${(props) => props.color};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  border: ${(props) => (props.selected ? `3px solid ${theme.colors.white}` : `2px solid ${theme.colors.gray}`)};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.fast};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  box-shadow: ${(props) => (props.selected ? `0 0 12px ${props.color}40` : "0 2px 4px rgba(0,0,0,0.2)")};

  &:hover:not([disabled]) {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  span {
    font-size: ${theme.fontSize.xs};
    font-weight: bold;
    color: ${(props) => (props.colorId === 1 ? theme.colors.dark : theme.colors.white)};
    text-shadow: ${(props) => (props.colorId === 1 ? "none" : "0px 0px 3px rgba(0,0,0,1)")};
  }
`;

const CooldownBanner = styled.div`
  color: ${theme.colors.warning};
  font-size: ${theme.fontSize.base};
  font-weight: bold;
  margin-bottom: ${theme.spacing.sm};
  padding: 6px;
  background-color: rgba(255, 153, 0, 0.2);
  border-radius: ${theme.borderRadius.sm};
`;

const HelpText = styled.div`
  margin-top: ${theme.spacing.xs};
  padding: 2px 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.lightGray};
  text-align: center;
  opacity: 0.85;
`;

// No props needed - component uses stores directly
type PlacementHUDProps = Record<string, never>;

const PlacementHUD: React.FC<PlacementHUDProps> = () => {
  // Use stores directly
  const canvasStore = useCanvasStore();
  const authStore = useAuthStore();

  const [selectedColorId, setSelectedColorId] = useState(5);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Get data from stores
  const selectedPixel = canvasStore.selectedPixel;
  const cooldownActive = canvasStore.cooldownActive;

  // Get available color IDs
  const availableColorIds = getAvailableColorIds();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownActive && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            canvasStore.setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownTime, canvasStore]);

  const handlePlacePixel = useCallback(() => {
    if (cooldownActive || !selectedPixel) return;

    // Check authentication
    if (!authStore.isAuthenticated) {
      authStore.showModal("You need to sign in to place pixels!");
      return;
    }

    const hexColor = colorIdToHex(selectedColorId);
    if (hexColor) {
      canvasStore.placePixel(hexColor);
      canvasStore.setCooldownActive(true);
      setCooldownTime(10); // 1 second at 100ms intervals
    }
  }, [cooldownActive, selectedPixel, selectedColorId]); // Remove store objects to prevent infinite loop

  // Set color preview when pixel is selected or color changes
  useEffect(() => {
    if (selectedPixel && !cooldownActive) {
      const hexColor = colorIdToHex(selectedColorId);
      if (hexColor) {
        canvasStore.setPreviewColor(hexColor);
      }
    }
  }, [selectedPixel, selectedColorId, cooldownActive]); // Remove canvasStore to prevent infinite loop

  // Handle Enter key to paint when pixel is selected (but not during cooldown)
  useEffect(() => {
    if (!selectedPixel || cooldownActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to paint
      if (e.key === "Enter") {
        e.preventDefault();
        handlePlacePixel();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedPixel, cooldownActive, handlePlacePixel]);

  const handleColorSelect = useCallback(
    (colorId: number) => {
      if (cooldownActive) return; // Don't allow color changes during cooldown
      setSelectedColorId(colorId);

      // Set color preview in store when pixel is selected
      if (selectedPixel) {
        const hexColor = colorIdToHex(colorId);
        if (hexColor) {
          canvasStore.setPreviewColor(hexColor);
        }
      }
    },
    [cooldownActive, selectedPixel]
  ); // Remove store objects to prevent infinite loop

  // Show cooldown state - but still allow pixel selection for pre-selection
  if (cooldownActive && !selectedPixel) {
    return (
      <HUDPanel placement="bottom-center" size="normal" style={{ textAlign: "center" }}>
        <CooldownBanner>Cooldown: {(cooldownTime / 10).toFixed(1)}s</CooldownBanner>
        <HUDLabel>You can still select pixels while waiting</HUDLabel>
      </HUDPanel>
    );
  }

  // Show prompt when no pixel selected
  if (!selectedPixel) {
    return (
      <HUDPanel placement="bottom-center" background="dark" size="normal" style={{ textAlign: "center" }}>
        <HUDLabel>Click a pixel to select it</HUDLabel>
      </HUDPanel>
    );
  }

  return (
    <HUDPanel
      placement="bottom-center"
      size="large"
      style={{ minWidth: "500px", maxWidth: "600px", textAlign: "center" }}
    >
      {cooldownActive && (
        <CooldownBanner>Cooldown: {(cooldownTime / 10).toFixed(1)}s - Pre-selecting for next paint</CooldownBanner>
      )}

      <HUDSection>
        <HUDValue style={{ color: "#ffff00", fontSize: theme.fontSize.lg, fontWeight: "bold" }}>
          Selected: ({selectedPixel.x}, {selectedPixel.y})
        </HUDValue>
      </HUDSection>

      <HUDGroup>
        <HUDLabel style={{ fontSize: theme.fontSize.base, marginBottom: theme.spacing.sm }}>Choose color:</HUDLabel>
        <ColorGrid>
          <ColorRow itemCount={10}>
            {availableColorIds.slice(0, 10).map((colorId) => {
              const hexColor = colorIdToHex(colorId);
              if (!hexColor) return null;

              return (
                <ColorSwatch
                  key={colorId}
                  color={hexColor}
                  selected={selectedColorId === colorId}
                  disabled={cooldownActive}
                  colorId={colorId}
                  onClick={() => handleColorSelect(colorId)}
                >
                  <span>{colorId}</span>
                </ColorSwatch>
              );
            })}
          </ColorRow>
          <ColorRow itemCount={9}>
            {availableColorIds.slice(10).map((colorId) => {
              const hexColor = colorIdToHex(colorId);
              if (!hexColor) return null;

              return (
                <ColorSwatch
                  key={colorId}
                  color={hexColor}
                  selected={selectedColorId === colorId}
                  disabled={cooldownActive}
                  colorId={colorId}
                  onClick={() => handleColorSelect(colorId)}
                >
                  <span>{colorId}</span>
                </ColorSwatch>
              );
            })}
          </ColorRow>
        </ColorGrid>
      </HUDGroup>

      <HUDGroup>
        <Button variant="primary" size="large" onClick={handlePlacePixel} disabled={cooldownActive}>
          {cooldownActive ? `Wait ${(cooldownTime / 10).toFixed(1)}s` : "Paint Pixel"}
        </Button>
      </HUDGroup>

      <HelpText>
        <div>ESC: deselect • ENTER: paint • Arrow keys: move cursor</div>
      </HelpText>
    </HUDPanel>
  );
};

export default PlacementHUD;
