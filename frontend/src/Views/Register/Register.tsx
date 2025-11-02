import * as React from 'react';
import { registerUser } from '../../router/routes';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { GoogleIcon } from './CustomIcons';
import { useGoogleLogin, CodeResponse } from '@react-oauth/google';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Alert, Collapse, IconButton, InputAdornment, OutlinedInput } from '@mui/material';
import { ErrorOutline, Visibility, VisibilityOff } from '@mui/icons-material';

const apiUrl = import.meta.env.VITE_BACKEND_LOCATION;
export const baseUrl = `http://${apiUrl}/`;

const SignUp: React.FC = () => {
  
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [usernameError, setUserNameError] = React.useState(false);
  const [usernameErrorMessage, setUserNameErrorMessage] = React.useState('');
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState(false);
  
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const { login } = useUser();
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse: CodeResponse) => {
      // Clear the input fields errors if user decides to use google to register/login
      setUserNameError(false);
      setUserNameErrorMessage('');
      setEmailError(false);
      setEmailErrorMessage('');
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
    const username = document.getElementById('username') as HTMLInputElement;
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.value) {
      setEmailError(true);
      setEmailErrorMessage('Email is required.');
      isValid = false;
    } else if (!emailRegex.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    const passwordRegex = /(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[#?!"@$ %^&*-+]).{8,64}$/;
    if (!password.value) {
      setPasswordError(true);
      setPasswordErrorMessage('Password is required.');
      isValid = false;
    } else if (!passwordRegex.test(password.value)) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be 8-64 characters long with at least one letter, one special character (#?!"@$ %^&*-+), and one number.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    const usernameRegex = /^[a-zA-Z0-9]{1,24}$/;
    if (!username.value) {
      setUserNameError(true);
      setUserNameErrorMessage('Username is required.');
      isValid = false;
    } else if (!usernameRegex.test(username.value)) {
      setUserNameError(true);
      setUserNameErrorMessage('Username can only contain alphanumeric characters and must be a maximum of 24 characters long.');
      isValid = false;
    } else {
      setUserNameError(false);
      setUserNameErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs() || usernameError || emailError || passwordError) {
      return;
    }

    const username = (document.getElementById('username') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const response = await registerUser(username, email, password);
      setFormMessage('Registration successful! Welcome to Swap My Bytes.');
      console.log('Registration Response:', response);

      login(response.userId);
      navigate('/');
    } catch (error: any) {
      setFormError(true);
      setFormMessage('Registration failed. Please try again.');
      console.error('Error during registration:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = event.target;
  
    if (name === 'username') {
      setUserNameError(false);
      setUserNameErrorMessage('');
    } else if (name === 'email') {
      setEmailError(false);
      setEmailErrorMessage('');
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
            height: "calc(100vh - 64px)", // Full viewport minus AppBar height
            padding: 0, // Remove any padding to prevent overflow
            margin: 0, // Remove margin to prevent additional space
            overflow: "hidden", // Ensure no scrollbars appear
            backgroundColor: "#f5f5f5", // Optional: Background color for the page
          }}
      >
        <Box
            sx={{
              width: { xs: "80%", sm: "70%", md: "50%", lg: "35%" },
              maxWidth: "400px",
              height: "auto",
              padding: { xs: "24px", sm: "32px", md: "40px" },
              backgroundColor: "#fff", // Inner content background color
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Optional: Add box shadow
              borderRadius: "8px", // Rounded corners for aesthetics
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
                  placeholder="Jon Snow"
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
            <FormControl>
              <FormLabel
                  htmlFor="email"
                  sx={{
                    color: "text.secondary",
                    textAlign: "left",
                    "&.Mui-focused": {
                      color: "rgb(28, 28, 28)",
                    },
                  }}
              >
                Email
              </FormLabel>
              <TextField
                  fullWidth
                  id="email"
                  placeholder="jon.snow@email.com"
                  name="email"
                  autoComplete="email"
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
              <Collapse in={Boolean(emailError)}>
                <Alert severity="error" sx={{ mt: 1, textAlign: { sm: "left" } }}>
                  {emailErrorMessage}
                </Alert>
              </Collapse>
            </FormControl>
            <FormControl>
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
              Sign up
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
              Sign up with Google
            </Button>
            <Typography sx={{ textAlign: "center" }}>
              Already have an account?{" "}
              <Button
                  variant="text"
                  onClick={() => navigate("/login")}
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
                Sign in
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
}

export default SignUp;