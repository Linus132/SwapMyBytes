import React, { useEffect } from 'react';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StarIcon from '@mui/icons-material/Star';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { useNavigate, useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';


const BottomNav: React.FC = () => {
  const [value, setValue] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const routes = [
    { path: "/files", label: "Files", icon: <FolderOpenIcon /> },
    { path: "/", label: "Upload", icon: <CloudUploadIcon /> },
    { path: "/trending", label: "Trending", icon: <StarIcon /> },
  ];

  useEffect(() => {
    const activeIndex = routes.findIndex(
      (route) => route.path === location.pathname
    );
    setValue(activeIndex !== -1 ? activeIndex : 0);
  }, [location.pathname]);

  const handleNavigation = (newValue: number) => {
    setValue(newValue);
    navigate(routes[newValue].path);
  };

  return (
    <div>
      <CssBaseline />
      {isMobile && (
        <Paper
          sx={{ 
            position: "fixed", 
            bottom: 0, 
            left: 0, 
            right: 0,
            backgroundColor: "rgb(168, 224, 242)",
            zIndex: 1200,
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              handleNavigation(newValue);
            }}
          >
            {routes.map((route, index) => (
              <BottomNavigationAction
                key={route.path}
                label={route.label}
                icon={route.icon}
                sx={{
                  color: "rgb(28, 28, 28)",
                  backgroundColor: value === index ? "rgba(210, 236, 245, 0.8)" : "transparent", 
                  borderRadius: value === index ? "8px" : "0px",
                  padding: "6px 12px",
                  "&.Mui-selected": {
                    color: "rgb(28, 28, 28)", // Prevent Material-UI from changing icon color
                  },
                  "&:hover": {
                    backgroundColor: value === index
                      ? "rgba(210, 236, 245, 0.8)"
                      : "rgba(210, 236, 245, 0.2)",
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper> 
      )}
    </div>
  );
};

export default BottomNav; 
