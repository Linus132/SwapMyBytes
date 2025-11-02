import express, { NextFunction, Request, Response, Router } from "express";
import User, { IUser } from "../db/User";
import { generateToken } from "../util";
import { SMB_ACCESS_COOKIE_OPTIONS, SMB_REFRESH_COOKIE_OPTIONS } from "../config";
import { SMB_PRIVATE_KEY_ACCESS_TOKEN, SMB_PRIVATE_KEY_REFRESH_TOKEN } from "../config";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import {
  validateOrReject,
  IsNotEmpty,
  IsString,
  Length,
} from "class-validator";
import { authenticateToken } from "../util";
import { AppError, ValidationError, AuthenticationError, NotFoundError, ForbiddenError } from "../errors/CustomErrors";
import { logger } from '../util';
import * as CustomErrors from "../errors/CustomErrors"

const router: Router = express.Router();

const isProduction: boolean = process.env.NODE_ENV === 'production';

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password } = req.body;
      logger.info("Registration attempt for username:", username);
      logger.debug("Password validation check");

      const validatePassword =
        /(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[#?!"@$ %^&*-+]).{8,64}$/g.test(
          password
        );
      if (!validatePassword) {
        throw new ValidationError('Invalid password format. Password must consist of 8 - 64 characters with at least one letter, one special character (#?!"@$ %^&*-+) and one number!');
      }

      const validateEmail =
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g.test(email);
      if (!validateEmail) {
        throw new ValidationError("Invalid E-Mail format.");
      }

      const validateUsername = /^[a-zA-Z0-9]{1,24}$/g.test(username);
      if (!validateUsername) {
        throw new ValidationError("Invalid Username. Only alphanumerical characters and a max length of 24 allowed!");
      }

      const existingEmail = await User.findOne({
        email: email,
      });
      if (existingEmail) {
        if (existingEmail.isGoogleUser) {
          throw new ForbiddenError('This email is linked to a Google account. Please sign in with Google.');
        } 
        throw new ValidationError("Email is already registered.");
      }

      const existingUsername = await User.findOne({
        username: username,
      });
      if (existingUsername) {
        throw new ValidationError("Username is already taken.");
      }

      const user = new User({
        username: username,
        email: email,
        password: password,
      });
      const savedUser: IUser = await user.save();

      const accessToken = generateToken(
        username,
        SMB_PRIVATE_KEY_ACCESS_TOKEN!
      );
      const refreshToken = generateToken(
        username,
        SMB_PRIVATE_KEY_REFRESH_TOKEN!
      );

      logger.info(`User registered successfully: ${username}`);
      res
        .status(200)
        .cookie("accessToken", accessToken, SMB_ACCESS_COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, SMB_REFRESH_COOKIE_OPTIONS)
        .json({ message: "Registration successful!", userId: user._id });
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(`Error during registration: ${err.message}`);
      } else {
        logger.error('Error during registration: Unknown error');
      }
      if (err instanceof AppError) {
        res.status(err.statusCode).json(err.getErrorResponse());
      } else {
        console.error(err);
        res.status(500).json({ error: "InternalServerError", message: "Error during registration" });
      }
    }
  }
);



class LoginRequestBody {
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}

interface LoginResponse {
  username: string;
  token: string;
}

// Login endpoint
router.post(
  "/login",
  async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
    logger.info("Attempting to login user");
    logger.debug("Login validation check");
    try {
      const loginRequest = new LoginRequestBody(
        req.body.username,
        req.body.password
      );

      // Validierung der Eingabedaten
      try {
        await validateOrReject(loginRequest);
      } catch (errors) {
        console.log(errors);
        res.status(400).json({ error: "Validation failed" });
        return;
      }

      const { username, password } = req.body;

      const user: IUser | null = await User.findOne({ username });

      if (user?.isGoogleUser) {
        throw new ForbiddenError('Login with Google is required for this account!');
      }

      // Verify user and password
      if (user && (await bcrypt.compare(password, user.password))) {

        const accessToken = generateToken(
          username,
          SMB_PRIVATE_KEY_ACCESS_TOKEN!
        );
        const refreshToken = generateToken(
          username,
          SMB_PRIVATE_KEY_REFRESH_TOKEN!
        );

        logger.info(`User logged in successfully: ${username}`);
        res
        .status(200)
        .cookie("accessToken", accessToken, SMB_ACCESS_COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, SMB_REFRESH_COOKIE_OPTIONS)
        .json({ message: "Login successful!", userId: user._id });
      } else {
        throw new AuthenticationError("Invalid credentials");
      }
    } catch (err: unknown) {
      logger.error(`Error during login: ${(err as Error).message}`);
      if (err instanceof AppError) {
        res.status(err.statusCode).json(err.getErrorResponse());
      } else {
        console.error("Error during login:", err);
        res.status(500).json({ error: "InternalServerError", message: "Error during login" });
      }
    }
  }
);

router.post('/logout', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("accessToken", SMB_ACCESS_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", SMB_REFRESH_COOKIE_OPTIONS);
    logger.info('User logged out successfully');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    logger.error(`Error during logout: ${(error as Error).message}`);
    console.error("Error during logout:", error); 
    res.status(500).json({ error: "InternalServerError", message: "Error during logout" });
  }
});

//check for auth status
router.get('/auth/status', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(200).json({ message: "You are logged in."})
  return;
});

//create new AccessToken from RefreshToken
router.post('/auth/refresh', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json(new CustomErrors.AuthenticationError("No refresh token provided."));
      return;
    }

    // Create new AccessToken
    const decodedToken = jwt.verify(refreshToken, SMB_PRIVATE_KEY_REFRESH_TOKEN!) as jwt.JwtPayload;
    const newAccessToken = generateToken(decodedToken.username, SMB_PRIVATE_KEY_ACCESS_TOKEN!);

    res.status(200)
      .cookie("accessToken", newAccessToken, SMB_ACCESS_COOKIE_OPTIONS)
      .json({ message: "Token refreshed" });
      
    return;
  } catch (error) {
    res.status(403).json(new CustomErrors.ForbiddenError("Invalid refresh token."));
    return;
  }
});

export default router;
