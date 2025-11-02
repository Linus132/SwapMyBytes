import crypto, { BinaryLike } from "crypto";
import jwt from "jsonwebtoken";
import fsPromises from "fs/promises";
import fs from "fs";
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import * as config from "./config";
import sharp from "sharp";
import File, { IFile } from "./db/File";
import User from "./db/User";
import fsSync from "fs";
import { fromFile } from "file-type";
import pdfThumbnail from 'pdf-thumbnail';
import ffmpeg from 'fluent-ffmpeg';
import winston from 'winston';
import * as customErrors from "./errors/CustomErrors"

export type DestinationCallback = (error: Error | null, destination: string) => void
export type FileNameCallback = (error: Error | null, filename: string) => void

export const uploadPath = path.join(config.SMB_BACKEND_ROOTDIR, "../uploads");
console.log(config.SMB_BACKEND_ROOTDIR);
export const tempDir = path.join(uploadPath, "temp");

const defaultThumbnailName = 'default-thumbnail.png';
const defaultThumbnailPath = path.join(uploadPath, defaultThumbnailName);

(async () => {
  await fsPromises.mkdir(uploadPath, { recursive: true });
  await fsPromises.mkdir(tempDir, { recursive: true });
  await ensureDefaultThumbnailExists();
})();

export async function ensureDefaultThumbnailExists() {
  try {
    // Überprüfe, ob das Standard-Thumbnail bereits existiert
    await fsPromises.access(defaultThumbnailPath);
    console.log('Default thumbnail already exists.');
  } catch {
    // Wenn das Standard-Thumbnail nicht existiert, erstelle es
    console.log('Creating default thumbnail...');
    await createDefaultThumbnail();
  }
}

export const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: DestinationCallback) => {
    if (req.path === "/upload") {
      cb(null, uploadPath); // path in docker: /usr/src/uploads
    } else if (req.path === "/upload-chunk") {
      cb(null, tempDir);
    } else {
      cb(new Error("Invalid endpoint for file upload"), "");
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
    cb(null, `${Date.now()}-${file.originalname}`); 
  },
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export async function hashFile(filePath: string): Promise<string> {
  try {
    const hash = crypto.createHash("sha256");
    const fileBuffer = await fsPromises.readFile(filePath);
    hash.update(fileBuffer);
    return hash.digest("hex");
  } catch (error: any) {
    throw new Error(`Error hashing file: ${error.message}`);
  }
}

export function generateToken(username: string, key: string) {
  const payload = {
      username : username,
      timeCreate: Date.now()
  }

  const Token = jwt.sign(payload, key)
  return Token
};

export function authenticateToken(req: Request, res: Response, next: NextFunction) : void {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      console.log("Tokens are missing")
      res.status(401).json(new customErrors.AuthenticationError("Tokens are missing, please log in or create an account."));
      return;
    }
    
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, config.SMB_PRIVATE_KEY_REFRESH_TOKEN!) as jwt.JwtPayload;
        if (!payload || !payload.username) {
          res.status(401).json(new customErrors.AuthenticationError("Invalid refresh token payload."));
          return;
        }

        if (payload.timeCreate + 604800000 < Date.now()){ //7 Days
          console.log("Refresh Token is expired.")
          throw new Error("Refresh token is expired. Please log in.")
        }
  
        const newAccessToken = generateToken(payload.username, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!);
        res.cookie('accessToken', newAccessToken, config.SMB_ACCESS_COOKIE_OPTIONS);
  
        return next(); 
      } catch (err) {
        console.error("Refresh Token verification failed:", err);
        res.status(401).json(new customErrors.AuthenticationError("Refresh token not valid."));
        return;
      }
    } else if (accessToken) {
      try {
        const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
        if (payload.timeCreate + 86400000 < Date.now()) { // 1 Day
          console.log("Access Token is expired")
          throw new Error("Access token is expired. Please send refresh token or log in again.")
        }
        return next();
      } catch (err) {
        console.error("Access Token verification failed:", err);
        res.status(401).json(new customErrors.AuthenticationError("Access token expired or invalid. Please send refresh token or log in again."));
        return;
      }
    }
  
  
  else {
    return next();
  }
};

export async function createThumbnail(filePath: string, mimeType: string): Promise<string> {
  const directory = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const thumbnailPath = path.join(directory, `${baseName}-thumbnail.png`);
  
  try {
    switch (mimeType) {
      case "image/jpeg":
      case "image/png":
      case "image/webp":
        return await createImgThumbnail(filePath, thumbnailPath);

      case "application/pdf":
        return await createPdfThumbnail(filePath, thumbnailPath);

      case "video/mp4":
      case "video/avi":
      case "video/mkv":
        return await createVideoThumbnail(filePath, thumbnailPath);

      case "audio/mpeg":
      case "audio/wav":
      case "audio/ogg":
        return await createAudioThumbnail(filePath, thumbnailPath);

      default:
        console.log(`Unsupported MIME type: ${mimeType}. Returning default thumbnail.`);
        return defaultThumbnailPath;
    }
  } catch (error) {
    console.error("Error creating thumbnail:", error);
    return defaultThumbnailPath;
  } 
};

export async function createImgThumbnail(filePath: string, thumbnailPath: string): Promise<string> {
  try {
    await sharp(filePath)
      .resize(200, 200) 
      .toFile(thumbnailPath);
    console.log('Thumbnail created:', thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('Error creating image thumbnail:', error);
    throw new Error(`Image thumbnail creation failed for ${thumbnailPath}`);
  }
};

async function createPdfThumbnail(filePath: string, thumbnailPath: string): Promise<string> {
  try {
    const fileBuffer = await fsPromises.readFile(filePath);
    const thumbnailStream = await pdfThumbnail(fileBuffer, {
      resize: {
        width: 200,   
        height: 200,  
      }
    })

    const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      thumbnailStream.on("data", (chunk) => chunks.push(chunk));
      thumbnailStream.on("end", () => resolve(Buffer.concat(chunks)));
      thumbnailStream.on("error", (err) => reject(err));
    });

    const resizedBuffer = await sharp(thumbnailBuffer)
      .resize(200, 200, {
        fit: "contain", 
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    await fsPromises.writeFile(thumbnailPath, resizedBuffer);

    console.log("PDF thumbnail created:", thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('Error creating PDF thumbnail:', error);
    throw new Error('PDF thumbnail creation failed');
  }
};

async function createVideoThumbnail(filePath: string, thumbnailPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .screenshots({
        count: 1, // Extract one frame
        folder: path.dirname(thumbnailPath),
        filename: path.basename(thumbnailPath),
        size: '200x200',
      })
      .on('end', () => {
        console.log('Video thumbnail created:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (error: any) => {
        console.error('Error creating video thumbnail:', error);
        reject(new Error('Video thumbnail creation failed'));
      });
  });
};

async function createAudioThumbnail(audioPath: string, thumbnailPath: string): Promise<string> {
  try {
    // Create a waveform thumbnail using ffmpeg
    const waveformPath = thumbnailPath.replace('.png', '-waveform.png');
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .complexFilter([
          'showwavespic=s=200x200:colors=blue',
        ])
        .output(waveformPath)
        .on('end', () => resolve())
        .on('error', (error: any) => reject(error))
        .run();
    });

    // Convert the waveform to a final thumbnail size using sharp
    await sharp(waveformPath).resize(200, 200).toFile(thumbnailPath);
    await fsPromises.unlink(waveformPath); // Delete the temporary waveform file
    console.log('Audio thumbnail created:', thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('Error creating audio thumbnail:', error);
    throw new Error('Audio thumbnail creation failed');
  }
};

export async function createDefaultThumbnail() {
  try {
    const defaultImage = path.join(__dirname, '/default-thumbnail.png'); 
    await sharp(defaultImage)
      .resize(200, 200) // Ändere die Größe des Standard-Thumbnail-Bildes
      .toFile(defaultThumbnailPath);
    console.log('Default thumbnail created:', defaultThumbnailPath);
  } catch (error) {
    console.error('Error creating default thumbnail:', error);
    throw new Error('Failed to create default thumbnail');
  }
};

export async function getTrendingFiles() {
  const trendingFiles = await File.aggregate([
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    { $sort: { likesCount: -1 } },
    { $limit: 10 },
  ]);

  if (trendingFiles.length === 0) {
    return null
  }
  return trendingFiles
}

export async function saveFileMetadata(
  originalName: string,
  filePath: string,
  fileHash: string,
  thumbnailPath: string,
  req: Request
): Promise<void> {
  try {
    const mimeTypeResult = await fromFile(filePath);
    const mimeType = mimeTypeResult ? mimeTypeResult.mime : "application/octet-stream";
    console.log("Detected MIME type:", mimeType);

    const fileData: Partial<IFile> = {
      fieldname: "file",
      originalname: originalName,
      encoding: "7bit",
      mimetype: mimeType,
      destination: path.dirname(filePath),
      filename: path.basename(filePath),
      path: filePath,
      size: (await fsPromises.stat(filePath)).size,
      hash: fileHash,
      thumbnail: thumbnailPath,
    };
  
    const file: IFile = new File(fileData);
    await file.save();
  
    const accessToken = req.cookies.accessToken;
    const payload = jwt.verify(
      accessToken,
      config.SMB_PRIVATE_KEY_ACCESS_TOKEN!
    ) as jwt.JwtPayload;
    const username = payload.username;
  
    await User.findOneAndUpdate(
      { username: username },
      { $set: { fileUploaded: true } },
      { new: true }
    );
  
    console.log("File metadata saved and user updated.");
  } catch (error) {
    console.error("Error saving file metadata:", error);
    throw new Error("Failed to save file metadata");
  }
}

export async function mergeChunks(originalName: string, totalChunks: number): Promise<string> {
  const finalFilePath = path.join(uploadPath, originalName);

  try {
    const writeStream = fsSync.createWriteStream(finalFilePath);
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `${originalName}-chunk-${i}`);
      
      try {
        await fsPromises.access(chunkPath);
      } catch {
        throw new Error(`Chunk ${i} is missing: ${chunkPath}`);
      }

      const data = await fsPromises.readFile(chunkPath);
      writeStream.write(data);

      await fsPromises.unlink(chunkPath);
      console.log(`Chunk ${i} merged and deleted.`);
    }

    writeStream.end();
    console.log(`File ${originalName} successfully merged at ${finalFilePath}`);
    return finalFilePath;
  } catch (error) {
    console.error("Error merging chunks:", error);
    throw new Error("Failed to merge chunks");
  }
}