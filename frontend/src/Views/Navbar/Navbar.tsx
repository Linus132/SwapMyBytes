import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StarIcon from '@mui/icons-material/Star';
import { useUser } from '../../contexts/UserContext';
import { Menu, MenuItem, Button, Typography, ListItemIcon, useTheme, useMediaQuery, Drawer, List, ListItem, ListItemText, Box } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shouldShowSidebar: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isLoggedIn, logout } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const excludedRoutes = ['/login', '/register'];
  const shouldShowLoginButton = !isLoggedIn && !excludedRoutes.includes(location.pathname);
  const shouldShowSidebar = !excludedRoutes.includes(location.pathname) && !isMobile;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handelLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.log('Error during logout:', error);
    } finally {
      handleClose();
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const routes = [
    { path: "/files", label: "Files", icon: <FolderOpenIcon /> },
    { path: "/", label: "Upload", icon: <CloudUploadIcon /> },
    { path: "/trending", label: "Trending", icon: <StarIcon /> },
  ];

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "rgb(48, 91, 184)"
        }}
      >
        <Toolbar 
          sx={{
            display: "flex",
            justifyContent: isMobile || !isLoggedIn ? "center" : "flex-start",
            alignItems: "center",
            position: "relative"
          }}
        >
        {!isMobile && shouldShowSidebar && isLoggedIn && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
        )}
          <Typography 
            variant="h5" 
            sx={{
              textAlign: isMobile || !isLoggedIn ? "center" : "left",
              flexGrow: isMobile || !isLoggedIn ? 1 : 0,
              marginLeft: !isMobile && shouldShowSidebar && isLoggedIn ? "13px" : 0, 
              width: "100%",
            }}
          >
            𝙎𝙬𝙖𝙥𝙈𝙮𝘽𝙮𝙩𝙚𝙨
          </Typography>
          {isLoggedIn ? (
            <div>
              <Box>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                <MenuItem onClick={handelLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
              </Box>
            </div>
          ) : (
            shouldShowLoginButton && (
              <Button color="inherit" onClick={() => navigate("/login")}>
                Login
              </Button>
            )
          )}
        </Toolbar>
      </AppBar>
      {shouldShowSidebar && !isMobile && (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          variant="persistent"
          sx={{
            "& .MuiDrawer-paper": {
              width: "180px",
              boxSizing: "border-box",
              marginTop: "64px",
              paddingTop: "5px", 
              boxShadow: "3px 0px 6px rgba(0, 0, 0, 0.1)", 
            },
          }}
        >
          <List sx={{ paddingTop: 0 }}>
            {routes.map((route) => (
              <ListItem
                key={route.path}
                button
                onClick={() => navigate(route.path)}
                disableTouchRipple
                sx={{
                  borderRadius: "16px",
                  backgroundColor:
                    location.pathname === route.path
                      ? "rgb(210, 236, 245)"
                      : "transparent",
                  margin: "4px 16px",
                  padding: "12px 24px", 
                  "&:hover": {
                    backgroundColor:
                      location.pathname === route.path
                        ? "rgb(210, 236, 245)"
                        : "rgba(210, 236, 245, 0.2)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "25px", 
                    marginRight: "18px",
                    color: "rgb(28, 28, 28)",
                    fontWeight:
                      location.pathname === route.path ? "bold" : "normal",
                  }}
                >
                  {route.icon}
                </ListItemIcon>
                <ListItemText
                  primary={route.label} 
                  sx={{
                    color:
                      location.pathname === route.path
                        ? "rgb(28, 28, 28)"
                        : "inherit",
                    fontWeight: location.pathname === route.path ? "bold" : "normal", 
                  }}
                 />
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}
    </div>
  );
};

export default Navbar;