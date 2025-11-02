import express, { NextFunction, Request, Response } from "express";
import fileRoutes from './routes/fileRoutes';
import userRoutes from './routes/userRoutes';
import cors from 'cors';
import googleOAuthRoutes from './routes/googleOAuthRoutes';
import * as config from './config';
import cookieParser from 'cookie-parser'
import { AppError } from "./errors/CustomErrors";
import expressWinston from 'express-winston';
import { logger } from './util';

const app = express();

const port = config.SMB_FRONTEND_PORT_EXTERNAL;

app.use(cors({
	origin: `http://127.0.0.1:${config.SMB_FRONTEND_PORT_EXTERNAL}`,
	credentials: true,
  }));

app.use((req, res, next) => {
	res.header("Access-Control-Expose-Headers", "Filename, Mimetype"); // Allows these headers
	next(); 
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
	console.log(
		`Logging middleware: ${new Date().toISOString()} - ${req.method} ${req.url}`,
	);
	next();
});

app.use('/files', fileRoutes);
app.use('/user', userRoutes);
app.use('/auth', googleOAuthRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running");
});

app.use((req: Request, res: Response) => {	
  res.status(404).json({ message: 'Not found!' });
});

app.use(expressWinston.errorLogger({
  winstonInstance: logger,
}));

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    logger.info(req.body);
    logger.error(err as Error);
    if (err instanceof AppError) {
        res.status(err.statusCode).json(err.getErrorResponse());
    } else {
        res.status(500).json({
            error: "InternalServerError",
            message: 'Server could not process your request. Try again later or report this to the server owner.',
        });
    }
});

export default app;

