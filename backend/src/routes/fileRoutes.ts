import express, { Request, Response } from "express";
import File, { IFile } from "../db/File";
import User from "../db/User";
import DownloadToken, {IDownloadToken} from "../db/DownloadToken";
import { Types } from "mongoose";
import multer from "multer";
import {
  authenticateToken,
  createThumbnail,
  getTrendingFiles,
  hashFile,
  mergeChunks,
  saveFileMetadata,
  tempDir,
  uploadPath,
  storage
} from "../util";
import path from "path";
import Like, { ILike } from "../db/Like";
import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";
import * as config from "../config";
import fs from "fs";
import { fromFile } from "file-type";
import { AppError, AuthenticationError, NotFoundError, ForbiddenError, DatabaseError } from "../errors/CustomErrors";
import {isNull} from "node:util";
import e from "express";
import { logger } from "../util";

const router = express.Router();

const upload = multer({ storage });

// GET: get random file
router.patch("/random", authenticateToken, async (req: Request, res: Response) => {
  logger.info("Attempting to get random file");
  console.log("try get random file");
  const accessToken = req.cookies.accessToken;
  try {
    // extract user information
    const payload = jwt.verify(
      accessToken,
      config.SMB_PRIVATE_KEY_ACCESS_TOKEN!
    ) as jwt.JwtPayload;
    const username = payload.username;

    const user = await User.findOne({ username: username });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.fileUploaded !== true) {
      throw new ForbiddenError("You need to upload a file before you can download a random file.");
    }

    const randomFile: IFile[] = await File.aggregate([
      { $match: { _id: { $nin: user.files } } }, // Exclude files the user already has
      { $sample: { size: 1 } },
    ]);

    if (randomFile.length === 0) {
      throw new NotFoundError("No files found");
    }

    await User.findOneAndUpdate(
      { username: username },
      {
        $addToSet: { files: randomFile[0]._id },
      },
      { new: true }
    );
    logger.info(`Random file retrieved successfully for user: ${username}`);
    res.status(200).json(randomFile[0]._id);
  } catch (err: any) {
    logger.error(`Error fetching random file: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error(err);
      res.status(500).json({error: "InternalServerError", message: "Error fetching random file"});
    }
  }
});

// GET: get trending files 
router.get("/trending", authenticateToken, async (req: Request, res: Response) => {
  logger.info("Attempting to get trending files");
  try {
    // find trending Files with highest likeCount
    const trendingFiles = await getTrendingFiles()

    if (!trendingFiles || trendingFiles.length === 0) {
      throw new NotFoundError("No trending files found");
    }

    
      const response = trendingFiles.map((file) => {
      let thumbnailBase64: string | null = null;
      if (fs.existsSync(file.thumbnail)) {
        const fileBuffer = fs.readFileSync(file.thumbnail);
        thumbnailBase64 = `data:${file.mimetype};base64,${fileBuffer.toString(
          "base64"
        )}`;
      }

      return{
        id: file._id,
        name: file.originalname,
        likecount: file.likes.length,
        mimeType: file.mimetype,
        thumbnail: thumbnailBase64,
        uploadDate: file.uploadDate,
        downloadLink: `/files/${file._id}`,
      };
    });

    logger.info("Trending files retrieved successfully");
    res.status(200).json(response); 
  } catch (err: any) {
    logger.error(`Error fetching trending files: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error(err);
      res.status(500).json({ error: "InternalServerError", message: "Error fetching trending files" });
    }
  }
});

// POST: generate download token
router.post('/generate-download', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  logger.info("Attempting to generate download token");
  const {fileId}= req.body;
  logger.info("Received fileId:", {fileId});
  const accessToken = req.cookies.accessToken;

  const file = await File.findById(fileId)
  logger.info(`Trying to generate download token for file ${file?.filename}`)

  try {

    if (!fileId) {
      throw new ForbiddenError("No file ID provided");
    }

    // extract user information
    const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
    const username = payload.username;
    const user = await User.findOne({ username });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const hasPermission = user.files.includes(fileId);

    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    const trendingFiles = await getTrendingFiles()

      let isTrending = false
      if(trendingFiles !== null){
        trendingFiles.forEach(document => {
          if (fileId == document._id){
            isTrending = true
            logger.info("File is trending")
          }
        });
      }

    if (hasPermission || isTrending) {
      const token = uuidv4();

      const newToken = await DownloadToken.create({
        fileId,
        token,
        expiresAt: new Date(Date.now() + 1000 * 30), // 30 Seconds
      });

      await User.findOneAndUpdate({ username }, { $addToSet: { files: fileId }});

      logger.info(`Download token generated successfully for file: ${fileId}`);
      res.json({ token: token });
    } else {
      throw new ForbiddenError("You do not have permission to download this file.");
    }
  } catch (err: any) {
    logger.error(`Error generating download token: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error(err);
      res.status(500).json({ error: "InternalServerError", message: "Error generating download token" });
    }
  }
});

// GET: Get all files of a user
router.get("/user", authenticateToken, async (req: Request, res: Response) => {
  logger.info("Attempting to get user files");
  const accessToken = req.cookies.accessToken;

  try {
     // extract user information
     const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
     const username = payload.username;

    // Find user by ID and populate their files
    const user = await User.findOne({username}).populate({
      path: "files",
      populate: {
        path: "likes", 
        select: "user", 
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (!user.files || user.files.length === 0) {
      throw new NotFoundError("No files found for this user");
    }

    const fileData = (user.files as IFile[]).map((file) => {
      const hasUserLike = (file.likes as ILike[]).some((like: ILike) => like.user?.toString() === user._id.toString());
      
      let thumbnailBase64: string | null = null;
      if (file.thumbnail && fs.existsSync(file.thumbnail)) {
        const fileBuffer = fs.readFileSync(file.thumbnail);
        thumbnailBase64 = `data:${file.mimetype};base64,${fileBuffer.toString(
          "base64"
        )}`;
      }

      return {
        id: file._id,
        name: file.originalname,
        thumbnail: thumbnailBase64,
        mimeType: file.mimetype,
        uploadDate: file.uploadDate,
        likecount: file.likes.length,
        hasUserLike,
      };
    });

    logger.info(`User files retrieved successfully for user: ${username}`);
    res.status(200).json(fileData);
  } catch (err: any) {
    logger.error(`Error fetching user files: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error(err);
      res.status(500).json({ error: "InternalServerError", message: "Error fetching user files" });
    }
  }
});

// GET: file with token
router.get("/:token", authenticateToken, async (req: Request, res: Response) => {
  const { token } = req.params;
  logger.info(`Attempting to get file with token: ${token}`);
  const accessToken = req.cookies.accessToken;
  console.log("try get file with token:", token);
  
    try {
      const downloadToken = await DownloadToken.findOne({token: token});
  
      if (!downloadToken) {
        throw new NotFoundError("Download token not found");
      }

      if (downloadToken.used == true) {
        throw new ForbiddenError("Download token already used. Please create a new one by uploading another file.");
      }

      console.log(Date.now())
      console.log(downloadToken.expiresAt)
      if (downloadToken.expiresAt < Date.now()) {
        throw new ForbiddenError("Download token expired. Please create a new one by uploading another file.");
      }

      const file = await File.findById(downloadToken.fileId);
      if (!file) {
        throw new NotFoundError("File not found");
      }

      const accessTokenPayload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
      const username = accessTokenPayload.username

      const user = await User.findOne({username: username})

      const userFiles = user!.files
      let fileMatched = false as boolean

      userFiles.forEach((file) => {
        if(file == downloadToken.fileId){
          fileMatched = true
      }})

      const trendingFiles = await getTrendingFiles()

      let isTrending = false as boolean
      if(trendingFiles){
        trendingFiles.forEach(document => {
          if (file == document){
            isTrending = true
          }
        });
      }

      if (fileMatched == true || isTrending == true){
        if (!file.mimetype || !file.path) {
          throw new DatabaseError("File metadata incomplete");
        }
  
        res.setHeader("Mimetype", file.mimetype);
        res.setHeader("Filename", file.originalname);
  
        const safeBasePath = path.resolve("./uploads");
        const safeFilePath = path.resolve(file.path);
  
        console.log(safeFilePath)
        /*if (!safeFilePath.startsWith(safeBasePath)) {
          res.status(403).json("Access denied");
          return;
        }*/
        
        await DownloadToken.findOneAndUpdate({token: token}, {used: true})

        await User.findOneAndUpdate(
          { username: username },
          {
            $set: { fileUploaded: false }
          },
          { new: true }
        );
        
        logger.info(`File retrieved successfully with token: ${token}`);
        res.sendFile(safeFilePath, (err) => {
          if (err) {
            logger.error(`Error sending file: ${err.message}`);
            console.error("Error sending file:", err);
            throw new DatabaseError("Error sending file");
          }
        });
      } else {
        throw new ForbiddenError("You do not have permission to download this file.");
      }
    }
      catch (err: unknown) {
        logger.error(`Error fetching file with token: ${(err as Error).message}`);
        if (err instanceof AppError) {
          res.status(err.statusCode).json(err.getErrorResponse());
        } else {
          console.error(err);
          res.status(500).json({ error: "InternalServerError", message: "Error fetching file with token" });
        }
      }
});

router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    logger.info("Attempting to upload file");
    try {
      logger.info("file:", req.file);

      if (!req.file) {
        throw new ForbiddenError("No file uploaded");
      }

      const requiredFields: (keyof Express.Multer.File)[] = [
        "fieldname",
        "originalname",
        "encoding",
        "mimetype",
        "destination",
        "filename",
        "path",
        "size",
      ];

      for (const field of requiredFields) {
        const fieldName: any = req.file![field];
        if (fieldName === undefined || fieldName === null) {
          throw new ForbiddenError(`Missing required field: ${field}`);
        }
      }

      const fileHash: string = await hashFile(req.file!.path);
      console.log("File hash:", fileHash);

      let thumbnailPath: string | undefined;
      try {
        thumbnailPath = await createThumbnail(req.file.path, req.file.mimetype);
      } catch (err) {
        console.log("creating thumbnail failed:" , err);
      }

      const fileData: Partial<IFile> = {
        fieldname: req.file!.fieldname,
        originalname: req.file!.originalname,
        encoding: req.file!.encoding,
        mimetype: req.file!.mimetype,
        destination: req.file!.destination,
        filename: req.file!.filename,
        path: req.file!.path,
        size: req.file!.size,
        hash: fileHash,
        thumbnail: thumbnailPath!,
      };

      const file: IFile = new File(fileData);
      console.log("Saving file...");
      const savedFile: IFile = await file.save();
      console.log("File saved successfully");

      const accessToken = req.cookies.accessToken;
      const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
      const username = payload.username;  
      await User.findOneAndUpdate(
        { username: username },
        { $set: { fileUploaded: true } },
        { new: true }
      );
      
      logger.info(`File uploaded successfully: ${req.file.originalname}`);
      res.status(200).json({
        message: "File uploaded successfully",
        fileId: savedFile._id
      });
    } catch (err: any) {
      logger.error(`Error uploading file: ${(err as Error).message}`);
      if (err instanceof AppError) {
        res.status(err.statusCode).json(err.getErrorResponse());
      } else {
        console.error(err);
        res.status(500).json({ error: "InternalServerError", message: "Failed to save file metadata" });
      }
    }
  }
);

router.post(
  "/upload-chunk",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
  logger.info("Attempting to upload file chunk");
  try {
    if (!req.file || !req.file.path) {
      console.error("Invalid file upload. req.file or req.file.path is missing.");
      throw new ForbiddenError("Invalid file uploaded or file path is missing.");
    }
    console.log("Request file:", req.file);

    const { chunkIndex, totalChunks, originalName } = req.body;

    if (!chunkIndex || !totalChunks || !originalName) {
      console.error("Missing metadata fields:", { chunkIndex, totalChunks, originalName });
      throw new ForbiddenError("Missing metadata fields: chunkIndex, totalChunks, originalName.");
    }

    const chunkPath = path.join(tempDir, `${originalName}-chunk-${chunkIndex}`);
    await fs.promises.rename(req.file.path, chunkPath);
    logger.info(`Chunk ${chunkIndex} saved successfully at ${chunkPath}`);

    logger.info(`Chunk ${chunkIndex} uploaded successfully for file: ${originalName}`);
    res.status(200).json({ message: "Chunk uploaded successfully." });
  } catch (err: any) {
    logger.error(`Error uploading file chunk: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error("Error processing chunk upload:", err);
      res.status(500).json({ error: "InternalServerError", message: "Failed to upload chunk." });
    }
  }
});

router.post(
  "/merge-chunks",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    logger.info("Attempting to merge file chunks");
    try {
      const { originalName, totalChunks } = req.body;

      if (!originalName || !totalChunks) {
        throw new ForbiddenError("Missing metadata fields: originalName, totalChunks.");
      }

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tempDir, `${originalName}-chunk-${i}`);
        try {
          await fs.promises.access(chunkPath);
          console.log(`Chunk ${i} exists.`);
        } catch {
          console.error(`Chunk ${i} is missing: ${chunkPath}`);
          res.status(400).json({ error: "BadRequestError", message: `Chunk ${i} is missing: ${chunkPath}` });
          return;
        }
      }

      const finalFilePath = path.join(uploadPath, originalName);
      await mergeChunks(originalName, parseInt(totalChunks));
      logger.info(`File ${originalName} merged successfully at ${finalFilePath}`);

      const mimeType = await fromFile(finalFilePath);
      let thumbnailPath: string | undefined;
      try {
        thumbnailPath = await createThumbnail(finalFilePath, mimeType!.mime);
      } catch (err) {
        console.log("creating thumbnail failed:" , err);
      }

      const fileHash = await hashFile(finalFilePath);

      await saveFileMetadata(originalName, finalFilePath, fileHash, thumbnailPath!, req);
      logger.info(`File metadata for ${originalName} saved to MongoDB.`);

      logger.info(`File ${originalName} merged successfully`);
      res.status(200).json({ message: "File merged successfully." });
    } catch (err: unknown) {
      logger.error(`Error merging file chunks: ${(err as Error).message}`);
      if (err instanceof AppError) {
        res.status(err.statusCode).json(err.getErrorResponse());
      } else {
        console.error(err);
        res.status(500).json({ error: "InternalServerError", message: "Failed to merge chunks." });
      }
    }
  }
);

router.patch("/like/:fileId", authenticateToken, async (req: Request, res: Response) => {
  const { fileId } = req.params;
  logger.info(`Attempting to like/unlike file: ${fileId}`);
  const accessToken = req.cookies.accessToken;
  const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
  const username = payload.username;
  const user = await User.findOne({ username });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const userId = user._id;


  if (!Types.ObjectId.isValid(fileId)) {
    throw new ForbiddenError("Invalid file or user ID");
  }

  try {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // check if user has already liked the file
    const alreadyLiked = await Like.findOne({ user: userId, _id: { $in: file.likes } });
    if (alreadyLiked) {
      try {
        // Find and delete the like
        const like = await Like.findOneAndDelete({
          user: userId,
          _id: { $in: file.likes }, 
        });
    
        if (!like) {
          throw new NotFoundError("Like not found");
        }
        
        file.likes = file.likes.filter(
          (likeId) => likeId?.toString() !== like._id?.toString()
        );
      
        await file.save();
    
        res.status(200).json({ message: "Like removed" });
      } catch (err: any) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json(err.getErrorResponse());
        } else {
          console.error("Error unliking file:", err);
          res.status(500).json({ error: "InternalServerError", message: "Error unliking file"});
        }
      }
      return;
    }

    const like = new Like({ user: userId });
    await like.save();

    file.likes.push(like._id);
    await file.save();

    logger.info(`File liked/unliked successfully: ${fileId}`);
    res.status(200).json({ message: "File liked/unliked", likeId: like._id });
  } catch (err: any) {
    logger.error(`Error liking/unliking file: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
      console.error("Error liking file:", err);
      res.status(500).json({ error: "InternalServerError", message: "Error liking file"});
    }
  }
});


router.delete("/:fileId", authenticateToken, async (req: Request, res: Response) => {
  const { fileId } = req.params;
  logger.info(`Attempting to delete file: ${fileId}`);
  const accessToken = req.cookies.accessToken;

  if (!Types.ObjectId.isValid(fileId)) {
    throw new ForbiddenError("Invalid file ID");
  }

  try {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // extract user information
    const payload = jwt.verify(accessToken, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!) as jwt.JwtPayload;
    const username = payload.username;
    const user = await User.findOne({ username });

    if(user){
      user.files = user.files.filter((id) => id?.toString() !== fileId);
      user.save();
    }else {
      throw new NotFoundError("User not found");
    }

    logger.info(`File deleted successfully: ${fileId}`);
    res.status(200).json({ message: "File deleted" });
  } catch (err: any) {
    logger.error(`Error deleting file: ${(err as Error).message}`);
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.getErrorResponse());
    } else {
    console.error(err);
    res.status(500).json({ error: "InternalServerError", message: "Error deleting file" });
    }
  }
});

export default router;