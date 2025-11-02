import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { GoogleIcon } from "../Register/CustomIcons";
import { LoginUser } from "../../router/routes";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin, CodeResponse } from '@react-oauth/google';
import { Alert, Collapse, colors, IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import { ErrorOutline, Visibility, VisibilityOff } from "@mui/icons-material";

const apiUrl = import.meta.env.VITE_BACKEND_LOCATION;
export const baseUrl = `http://${apiUrl}/`;

const Login: React.FC = () => {

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse: CodeResponse) => {
      // Clear the input fields errors if user decides to use google to register/login
      setUsernameError(false);
      setUsernameErrorMessage('');
      setPasswordError(false);
      setPasswordErrorMessage('');
      setFormError(false); 
      setFormMessage('');

      try {
        const response = await fetch(`${baseUrl}auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          setFormError(true);
          setFormMessage(errorData.error || "An unknown error occurred during Google login.");
          return;
        }

        const data = await response.json();
        login(data.userId);
        navigate('/');
      } catch (error) {
        console.error('Error during Google login:', error);
        setFormError(true);
        setFormMessage("An error occurred while logging in with Google. Please try again.");
      }
    },
    onError: (errorResponse: unknown) => console.log('Google login failed:', errorResponse),
    flow: 'auth-code',
  });

  const validateInputs = () => {
    const usernameInput = document.getElementById("username") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;

    let isValid = true;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      setUsernameError(true);
      setUsernameErrorMessage("Username is required.");
      isValid = false;
    } else if (username.length > 20) {
        setUsernameError(true);
        setUsernameErrorMessage("Username must be at most 20 characters.");
        isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage("");
    }

    if (!password) {
        setPasswordError(true);
        setPasswordErrorMessage("Password is required.");
        isValid = false;
    } else if (password.length < 6) {
        setPasswordError(true);
        setPasswordErrorMessage("Password must be at least 6 characters.");
        isValid = false;
    } else if (password.length > 20) {
        setPasswordError(true);
        setPasswordErrorMessage("Password must be at most 20 characters.");
        isValid = false;
    } else {
        setPasswordError(false);
        setPasswordErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs() || usernameError || passwordError) {
      return;
    }

    const username = (document.getElementById("username") as HTMLInputElement)
      .value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    try {
      const response = await LoginUser(username, password);
      login(response.userId);
      setFormMessage("Login successful! Welcome to Swap My Bytes.");
      
      navigate('/');
    } catch (error: any) {
      setFormError(true);
      setFormMessage(error.message);
      console.error('Error during login:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name } = event.target;
    
      if (name === 'username') {
        setUsernameError(false);
        setUsernameErrorMessage('');
      } else if (name === 'password') {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }
  
      setFormError(false);
      setFormMessage('');
    };

    return (
        <Box
            sx={{
                display: "flex", // Flexbox for centering
                justifyContent: "center", // Centers horizontally
                alignItems: "center", // Centers vertically
                height: "calc(100vh - 64px)", // Full viewport minus AppBar height (adjust for mobile if needed)
                padding: 0, // Remove unnecessary padding
                margin: 0, // Remove margin to prevent overflow
                overflow: "hidden", // Prevent scrollbars from appearing
                backgroundColor: "#f5f5f5", // Optional: Background color for the page
            }}
        >
            <Box
                sx={{
                    width: { xs: "80%", sm: "70%", md: "50%", lg: "35%" },
                    maxWidth: "400px",
                    height: "auto",
                    padding: { xs: "24px", sm: "32px", md: "40px" },
                    backgroundColor: "#fff", // Background for the inner box
                    borderRadius: "8px", // Optional: Rounded corners
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                    <FormControl>
                        <FormLabel
                            htmlFor="username"
                            sx={{
                                color: "text.secondary",
                                textAlign: "left",
                                "&.Mui-focused": {
                                    color: "rgb(28, 28, 28)",
                                },
                            }}
                        >
                            User Name
                        </FormLabel>
                        <TextField
                            autoComplete="username"
                            name="username"
                            fullWidth
                            id="username"
                            placeholder="Your User Name"
                            variant="outlined"
                            onChange={handleInputChange}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgb(28, 28, 28)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgb(28, 28, 28)",
                                    },
                                },
                            }}
                        />
                        <Collapse in={Boolean(usernameError)}>
                            <Alert severity="error" sx={{ mt: 1, textAlign: { sm: "left" } }}>
                                {usernameErrorMessage}
                            </Alert>
                        </Collapse>
                    </FormControl>
                    <FormControl variant="outlined">
                        <FormLabel
                            htmlFor="password"
                            sx={{
                                color: "text.secondary",
                                textAlign: "left",
                                "&.Mui-focused": {
                                    color: "rgb(28, 28, 28)",
                                },
                            }}
                        >
                            Password
                        </FormLabel>
                        <OutlinedInput
                            fullWidth
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            autoComplete="current-password"
                            onChange={handleInputChange}
                            sx={{
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgb(28, 28, 28)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgb(28, 28, 28)",
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(0, 0, 0, 0.23)",
                                },
                            }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={
                                            showPassword ? "hide the password" : "display the password"
                                        }
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        onMouseUp={handleMouseUpPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                        <Collapse in={Boolean(passwordError)}>
                            <Alert severity="error" sx={{ mt: 1, textAlign: { sm: "left" } }}>
                                {passwordErrorMessage}
                            </Alert>
                        </Collapse>
                    </FormControl>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundColor: "rgb(48, 91, 184)",
                            "&:hover": {
                                backgroundColor: "rgba(48, 91, 184, 0.9)",
                            },
                        }}
                    >
                        Login
                    </Button>
                </Box>
                <Divider>
                    <Typography sx={{ color: "text.secondary", padding: 1 }}>or</Typography>
                </Divider>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => googleLogin()}
                        startIcon={<GoogleIcon />}
                        sx={{
                            color: "rgb(28, 28, 28)",
                            borderColor: "rgb(28, 28, 28)",
                            "&:hover": {
                                borderColor: "rgba(28, 28, 28, 0.8)",
                            },
                        }}
                    >
                        Login with Google
                    </Button>
                    <Typography sx={{ textAlign: "center" }}>
                        Not yet registered?{" "}
                        <Button
                            variant="text"
                            component="span"
                            onClick={() => navigate("/register")}
                            sx={{
                                display: "inline",
                                padding: 0,
                                minWidth: "auto",
                                textTransform: "none",
                                color: "primary.main",
                                verticalAlign: "baseline",
                                fontSize: "inherit",
                                fontFamily: "inherit",
                                "&:hover": {
                                    color: "primary.dark",
                                    textDecoration: "underline",
                                    backgroundColor: "transparent",
                                },
                            }}
                        >
                            Register
                        </Button>
                    </Typography>
                </Box>
                <Box>
                    <Collapse in={Boolean(formError)}>
                        <Alert
                            icon={<ErrorOutline />}
                            severity="error"
                            sx={{
                                mt: 1,
                                textAlign: "left",
                                marginTop: 2,
                            }}
                        >
                            {formMessage}
                        </Alert>
                    </Collapse>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
