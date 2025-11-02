import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from "@mui/material";
import Navbar from "../Navbar/Navbar";
import BottomNav from "../BottomNav/BottomNav";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';

const AppLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

    const excludedRoutes = ["/login", "/register"];
    const shouldShowSidebar = !excludedRoutes.includes(location.pathname);
    const shouldShowBottomNav = !excludedRoutes.includes(location.pathname);

    const sidebarWidth = "200px";
  
    useEffect(() => {
    if (isMobile && shouldShowSidebar) {
        setSidebarOpen(false);
    } else if (isDesktop && shouldShowSidebar) {
        setSidebarOpen(true);
    }
    }, [isMobile, isDesktop, shouldShowSidebar]);
      
    return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            shouldShowSidebar={shouldShowSidebar}
          />
          <div
            style={{
              display: "flex",
              flex: 1,
            }}
          >
            {shouldShowSidebar && (
              <div
                style={{
                    width: sidebarOpen ? sidebarWidth : "0px",
                    transition: "width 0.3s ease",
                    flexShrink: 0,
                }}
              />
            )}
    
            <main
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                /*padding: shouldShowSidebar && sidebarOpen ? "16px" : "16px 16px 16px 0",*/
                marginBottom: shouldShowBottomNav ? "56px" : "0px",
                boxSizing: "border-box",
                transition: "padding 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                }}
              >
              {children}
              </div>
            </main>
          </div>
    
          {shouldShowBottomNav && <BottomNav />}
        </div>
      );
    };
  
  export default AppLayout;