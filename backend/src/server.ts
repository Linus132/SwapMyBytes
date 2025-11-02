import app from "./app";
import * as config from './config';
import mongoose from 'mongoose';
import { logger } from './util';

const mongoDBConnectionString = `mongodb://${config.SMB_MONGO_SERVICE_LOCATION}:${config.SMB_BACKEND_DOCKERIZED === 'true' ? config.SMB_MONGO_PORT_INTERNAL : config.SMB_MONGO_PORT_EXTERNAL}/${config.SMB_MONGO_DBNAME}`;

if (process.env.NODE_ENV !== "test") {
	mongoose.connect(mongoDBConnectionString)
		.then(() => {
			logger.info(`Connected to MongoDB at ${mongoDBConnectionString}`);
			app.listen(config.SMB_BACKEND_PORT_EXTERNAL, () => {
				logger.info(`Server is running on port ${config.SMB_BACKEND_PORT_EXTERNAL}`);
			});
		})
		.catch((err) => {
			logger.error("Failed to connect to MongoDB:", err);
		});
}

export default app;