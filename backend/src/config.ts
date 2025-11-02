import dotenv, {DotenvConfigOutput} from 'dotenv';
import { CookieOptions } from 'express';
import path from "path";

// Load .env file only if the app is not running inside a Docker container
// In this case the .env file will be at ROOT Level

const envPath : string = path.join(__dirname, '../../.env');

// Save the app root directory as additional env variable (The full path where the backend files reside)
const appRoot = path.join(path.dirname(require.main?.filename ?? process.cwd()));
process.env.SMB_BACKEND_ROOTDIR = appRoot;

if (!process.env.DOCKERIZED) {
	let config : DotenvConfigOutput = dotenv.config({
		debug: true,
		encoding: 'utf8',
		path: envPath
	})
	if (config.error) {
		console.error(`Failed to load .env file: ${envPath}`);
	}
	else console.info(`Successfully loaded .env file!`);
}

// Misc
export const SMB_BACKEND_ROOTDIR : string = process.env.SMB_BACKEND_ROOTDIR;
export const SMB_BACKEND_DOCKERIZED : string = process.env.DOCKERIZED ?? 'false';

// Production flag
export const SMB_IN_PRODUCTION : boolean = process.env.SMB_IN_PRODUCTION == 'true';

// Access Cookie options
export const SMB_ACCESS_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: SMB_IN_PRODUCTION,
	secure: SMB_IN_PRODUCTION,
	sameSite: 'lax'
};

// Refresh Cookie options
export const SMB_REFRESH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: SMB_IN_PRODUCTION,
	secure: SMB_IN_PRODUCTION,
    sameSite: "strict", 
    path: "/user/auth/refresh"
};

// MongoDB
export const SMB_MONGO_DBNAME : string | undefined = process.env.SMB_MONGO_DBNAME;
export const SMB_MONGO_SERVICE_LOCATION : string | undefined = SMB_BACKEND_DOCKERIZED == 'true' ? process.env.SMB_MONGO_SERVICE_LOCATION : '127.0.0.1';
export const SMB_MONGO_PORT_INTERNAL : string | undefined = process.env.SMB_MONGO_PORT_INTERNAL;
export const SMB_MONGO_PORT_EXTERNAL : string | undefined= process.env.SMB_MONGO_PORT_EXTERNAL;

// Backend
export const SMB_BACKEND_PORT_INTERNAL : string | undefined = process.env.SMB_BACKEND_PORT_INTERNAL;
export const SMB_BACKEND_PORT_EXTERNAL : string | undefined = process.env.SMB_BACKEND_PORT_EXTERNAL;
export const SMB_PRIVATE_KEY_ACCESS_TOKEN : string | undefined = process.env.SMB_PRIVATE_KEY_ACCESS_TOKEN;
export const SMB_PRIVATE_KEY_REFRESH_TOKEN : string | undefined = process.env.SMB_PRIVATE_KEY_REFRESH_TOKEN;

// Frontend
export const SMB_FRONTEND_PORT_INTERNAL : string | undefined = process.env.SMB_FRONTEND_PORT_INTERNAL;
export const SMB_FRONTEND_PORT_EXTERNAL : string | undefined = process.env.SMB_FRONTEND_PORT_EXTERNAL;

// Google OAuth
export const SMB_CLIENT_ID : string | undefined = process.env.SMB_CLIENT_ID;
export const SMB_CLIENT_SECRET : string | undefined = process.env.SMB_CLIENT_SECRET;