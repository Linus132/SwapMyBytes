import express, { Request, Response, Router } from "express";
import { OAuth2Client, UserRefreshClient, TokenPayload, Credentials } from "google-auth-library";
import * as config from '../config';
import User, { IUser } from "../db/User";
import { generateToken } from "../util";
import { logger } from '../util';
import { SMB_ACCESS_COOKIE_OPTIONS, SMB_REFRESH_COOKIE_OPTIONS } from "../config";

const router: Router = express.Router();
const clientId: string = config.SMB_CLIENT_ID!;
const clientSecret: string = config.SMB_CLIENT_SECRET!;
const privateKeyAccessToken = config.SMB_PRIVATE_KEY_ACCESS_TOKEN!;
const privateKeyRefreshToken = config.SMB_PRIVATE_KEY_REFRESH_TOKEN!;

const oAuth2Client: OAuth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    'postmessage'
);

// This endpoint is used to register/login a user with Google OAuth
router.post('/google', async (req: Request, res: Response) => {
    try {
        const code: string = req.body.code;

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        logger.info("Tokens received from google:", tokens);
    
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: clientId,
          });
    
        const payload: TokenPayload = ticket.getPayload()!;
    
        const email: string = payload!.email!;
        
        const existingEmail = await User.findOne({
            email: email,
        });

        let user;
        let username;
        
        if (!existingEmail) {
            const firstName: string = payload!.given_name!.at(0)!;
            const lastName: string = payload!.family_name!.at(0)!;
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            username = `${firstName}${lastName}${randomNumber}`.toLowerCase();

            user = new User({
                username,
                email,
                password: "google_oauth_placeholder_password",
                isGoogleUser: true,
            })

            await user.save();
        } else {
            user = await User.findOne({ email });
            username = user?.username;
        }
      
        const accessToken = generateToken(
            username!,
            privateKeyAccessToken
        );
        const refreshToken = generateToken(
            username!,
            privateKeyRefreshToken
        );

        logger.info(`User authenticated with Google: ${email}`);
        res.status(200)
            .cookie("accessToken", accessToken, SMB_ACCESS_COOKIE_OPTIONS)
            .cookie("refreshToken", refreshToken, SMB_REFRESH_COOKIE_OPTIONS)
            .json({ message: "Welcome!", userId: user!._id });
        
    } catch (error: any) {
        logger.error("Error during Google OAuth:", error);
        res.status(500).json({ error: "Failed to authenticate with Google" });
    }
});

export default router;