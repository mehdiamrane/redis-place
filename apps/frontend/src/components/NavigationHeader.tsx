import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores";
import { HUDPanel, HUDSection, HUDGroup, Button } from "./ui";
import { theme } from "../styles/theme";

const NavigationContainer = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  right: ${theme.spacing.md};
  z-index: ${theme.zIndex.nav};
`;

const NavButton = styled(Button)<{ isActive: boolean }>`
  flex: 1;
  justify-content: center;
  text-align: center;
  cursor: ${(props) => (props.isActive ? "default" : "pointer")};
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xs};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const UserInfo = styled.div`
  color: ${theme.colors.white};
  font-weight: bold;
  font-size: ${theme.fontSize.sm};
  text-align: center;
  padding: ${theme.spacing.xs};
  opacity: 0.8;
`;

const NavigationHeader: React.FC = () => {
  const { isAuthenticated, username, logout, showModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleNavigation = (route: string) => {
    if (location.pathname !== route) {
      navigate(route);
    }
  };

  const handleShowProfile = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("userProfile", username || "current");
    setSearchParams(newSearchParams);
  };

  const handleSignInClick = () => {
    showModal("Sign in to access your profile and place pixels!");
  };

  return (
    <NavigationContainer>
      <HUDPanel position="relative" title="🧭 Navigation" style={{ width: "250px" }}>
        {/* Navigation Links */}
        <HUDSection>
          <ButtonGrid>
            <NavButton
              variant={location.pathname === "/" ? "success" : "gray"}
              size="small"
              onClick={() => handleNavigation("/")}
              isActive={location.pathname === "/"}
            >
              🎨 Canvas
            </NavButton>

            <NavButton
              variant={location.pathname === "/badges" ? "success" : "gray"}
              size="small"
              onClick={() => handleNavigation("/badges")}
              isActive={location.pathname === "/badges"}
            >
              🏆 Badges
            </NavButton>

            <NavButton
              variant={location.pathname === "/analytics" ? "success" : "gray"}
              size="small"
              onClick={() => handleNavigation("/analytics")}
              isActive={location.pathname === "/analytics"}
            >
              📊 Analytics
            </NavButton>

            <NavButton
              variant={location.pathname === "/replay" ? "success" : "gray"}
              size="small"
              onClick={() => handleNavigation("/replay")}
              isActive={location.pathname === "/replay"}
            >
              🎬 Replay
            </NavButton>
          </ButtonGrid>
        </HUDSection>

        {/* User Section */}
        <HUDSection>
          {isAuthenticated ? (
            <HUDGroup>
              <UserInfo>Logged in as {username}</UserInfo>
              <ButtonRow>
                <Button variant="gray" size="small" onClick={handleShowProfile} style={{ flex: 1 }}>
                  👤 Profile
                </Button>
                <Button variant="danger" size="small" onClick={logout} style={{ flex: 1 }}>
                  🚪 Logout
                </Button>
              </ButtonRow>
            </HUDGroup>
          ) : (
            <Button variant="gray" size="small" onClick={handleSignInClick} style={{ width: "100%" }}>
              🔑 Sign In
            </Button>
          )}
        </HUDSection>
      </HUDPanel>
    </NavigationContainer>
  );
};

export default NavigationHeader;
