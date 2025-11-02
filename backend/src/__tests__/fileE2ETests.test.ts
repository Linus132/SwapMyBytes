import request from "supertest";
import app from "../app";
import User from "../db/User";
import File from "../db/File";
import DownloadToken from "../db/DownloadToken";
import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import fs from 'fs';
import jwt from "jsonwebtoken";
import * as config from "../config";
import { ForbiddenError, NotFoundError } from "../errors/CustomErrors";

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;

process.env.NODE_ENV = "test";

describe("File Router Tests", () => {
  beforeAll(async () => {
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {});
   })

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    const user = await User.create({
      email: "test@user.com",
      username: "testuser",
      password: "password123",
      fileUploaded: false,
    });

    userId = user._id.toString();
    token = jwt.sign({ username: user.username, timeCreate: Date.now() }, config.SMB_PRIVATE_KEY_ACCESS_TOKEN!);



    // Upload a file with user1
    const testFilePath = path.join(__dirname, "../../db/init/files", "user1_file1.jpg");
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Testdatei nicht gefunden: ${testFilePath}`);
    }

    const originalConsoleLog = console.log;
    console.log = () => {}; // Deactivating console.log

    //Uploading 10 Files wit 1 like each
    for(let i = 0; i < 10; i++){
      const respone = await request(app)
        .post("/files/upload")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", testFilePath);

      await request(app)
        .patch(`/files/like/${respone.body.fileId}`)
        .set("Cookie", [`accessToken=${token}`])
        .send({ userId: userId})
    }

    console.log = originalConsoleLog; // Reactivating console.log

    const testFilePath2 = path.join(__dirname, "../../db/init/files", "user2_file1.jpg");
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Testdatei nicht gefunden: ${testFilePath}`);
    }
    await request(app)
        .post("/files/upload")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", testFilePath2);
  })
  

   describe("GET /files/random", () => {
    it("should return 200 if user has uploaded a file", async () => {
      const res = await request(app)
        .patch("/files/random")
        .set("Cookie", [`accessToken=${token}`]);
      expect(res.status).toBe(200);
    });

    it("should return 403 is user hasn't uploaded a file prior", async () => {
      await User.findOneAndUpdate({username: "testuser"}, {fileUploaded: false})
      const res = await request(app)
        .patch("/files/random")
        .set("Cookie", [`accessToken=${token}`]);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    })
  });

  describe("GET /files/trending", () => {
    it("should return trending files", async () => {
      const res = await request(app)
        .get("/files/trending")
        .set("Cookie", [`accessToken=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it("should return trending files with all required properties", async () => {
      const res = await request(app)
        .get("/files/trending")
        .set("Cookie", [`accessToken=${token}`]);
        
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      if (res.body.length > 0) {
        const file = res.body[0];
        expect(file).toHaveProperty("id");
        expect(file).toHaveProperty("name");
        expect(file).toHaveProperty("likecount");
        expect(file).toHaveProperty("mimeType");
        expect(file).toHaveProperty("thumbnail");
        expect(file).toHaveProperty("uploadDate");
        expect(file).toHaveProperty("downloadLink");
      }
    });
  });

  describe("POST /files/generate-download", () => {
    it("should return a download token if user is authorized", async () => {
      const user = await User.findById(userId);
      const file = await File.findOne()
      user!.files.push(file!._id);
      await user!.save();

      const res = await request(app)
        .post("/files/generate-download")
        .set("Cookie", [`accessToken=${token}`])
        .send({ fileId: file!._id });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should return 403 if user is not authorized to download the file", async () => {
      const fileWithoutLikes = await File.findOne({likes: []})
      const fileId = await fileWithoutLikes!._id

      const user = await User.findOne()
      const userFiles = user!.files

      const res = await request(app)
        .post("/files/generate-download")
        .set("Cookie", [`accessToken=${token}`])
        .send({ fileId: fileId });

      console.log(`Files of User:${userFiles}`)
      console.log(`File without likes: ${fileId}`)
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    });

    it("should return 403 if no fileId is provided", async () => {
      const res = await request(app)
        .post("/files/generate-download")
        .set("Cookie", [`accessToken=${token}`])
        .send({});
  
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("No file ID provided");
    });
  });

  describe("GET /files/user", () => {
    it("should return user files", async () => {
      const file = await File.findOne()

      await User.findOneAndUpdate({username: "testuser"}, {$set: {files: [file!._id]}})

      const res = await request(app)
        .get("/files/user")
        .set("Cookie", [`accessToken=${token}`]);

      console.log(`User Files: ${res.body}`)
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });

    it("should return 404 if user has no files", async () => {
      await User.findByIdAndUpdate(userId, { $set: { files: [] } })
      const res = await request(app)
        .get("/files/user")
        .set("Cookie", [`accessToken=${token}`]);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NotFoundError");
    });
  });

  describe("DELETE /files/:fileId", () => {
    it("should delete the file", async () => {
      const file = await File.findOne()

      await User.findOneAndUpdate({username: "testuser"}, {$set: {files: [file!._id]}})

      const res = await request(app)
        .delete(`/files/${file!._id}`)
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("File deleted");
    });

    it("should not delete the file if user doesn't have it assigned.", async () => {
      await User.findOneAndDelete()
      const file = await File.findOne()

      const res = await request(app)
        .delete(`/files/${file!._id}`)
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("NotFoundError");
    });
  });

  describe("PATCH /files/like/:fileId", () => {
    it("should like the file if it's not liked by the user yet", async () => {
      const file = await File.findOne({ likes: { $exists: true, $eq: [] } });
      const user = await User.findOne()
      userId = user!._id.toString();

      const res = await request(app)
        .patch(`/files/like/${file!._id}`)
        .set("Cookie", [`accessToken=${token}`])
        .send({ userId: userId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("File liked/unliked");
    });

    it("should unlike the file if user has already liked it", async () => {
      const file = await File.findOne({ likes: { $exists: true, $ne: [] } });
      const user = await User.findOne()
      userId = user!._id.toString();

      const res = await request(app)
        .patch(`/files/like/${file!._id}`)
        .set("Cookie", [`accessToken=${token}`])
        .send({ userId: userId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Like removed");
    });
  });

  describe("POST /upload", () => {
    const testFilePath = path.join(__dirname, "../../db/init/files", "user3_file1.jpg");
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Testdatei nicht gefunden: ${testFilePath}`);
    }

    it("should return 403 if no file is uploaded", async () => {
      const res = await request(app)
        .post("/files/upload")
        .set("Cookie", [`accessToken=${token}`]);
  
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    });  
  
    it("should upload file and update user fileUploaded field", async () => {
      const res = await request(app)
        .post("/files/upload")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", testFilePath);
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("File uploaded successfully");
  
      const savedFile = await File.findOne({ originalname: "user3_file1.jpg" });
      expect(savedFile).toBeDefined();
      expect(savedFile?.originalname).toBe("user3_file1.jpg");
  
      const user = await User.findOne({ username: "testuser" });
      expect(user?.fileUploaded).toBe(true);
    }); 
  });

  describe("GET /:token", () => {
    it("should return 404 if no download token is found", async () => {
      const res = await request(app)
        .get("/nonexistingtoken")
        .set("Cookie", [`accessToken=${token}`]);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Not found!");
    });

    it("should return 403 if the token is already used", async () => {
      const downloadToken = await DownloadToken.create({
        token: "usedtoken",
        used: true,
        expiresAt: Date.now() + 60000, 
        fileId: new mongoose.Types.ObjectId()
      });
  
      const res = await request(app)
        .get(`/files/${downloadToken.token}`)
        .set("Cookie", [`accessToken=${token}`]);
  
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    });

    it("should return 403 if the token is expired", async () => {
      const downloadToken = await DownloadToken.create({
        token: "expiredtoken",
        used: false,
        expiresAt: Date.now() - 1000,
        fileId: new mongoose.Types.ObjectId()
      });
  
      const res = await request(app)
        .get(`/files/${downloadToken.token}`)
        .set("Cookie", [`accessToken=${token}`]);
  
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    });

    it("should return 400 if file id is invalid", async () => {
      const downloadToken = await DownloadToken.create({
        token: "invalididtoken",
        used: false,
        expiresAt: Date.now() + 60000,
        fileId: "notavalidid"
      });
  
      const res = await request(app)
        .get(`/files/${downloadToken.token}`)
        .set("Cookie", [`accessToken=${token}`]);
  
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Error fetching file with token");
    });

    it("should return 403 if user is not permitted to download the file", async () => {
      const file = await File.create({
        originalname: "restricted.txt",
        mimetype: "text/plain",
        path: path.join(__dirname, "restricted.txt"), 
        hash: "dummyhash",
        size: 1234,
        filename: "restricted.txt",
        destination: "/uploads", 
        encoding: "7bit",
        fieldname: "file"
      });
    
      const downloadToken = await DownloadToken.create({
        token: "notauthorizedtoken",
        used: false,
        expiresAt: Date.now() + 60000,
        fileId: file._id
      });
    
      const res = await request(app)
        .get(`/files/${downloadToken.token}`)
        .set("Cookie", [`accessToken=${token}`]);
    
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("ForbiddenError");
    });
    

    it("should send file if token is valid and user is authorized", async () => {
      const filePath = path.join(__dirname, "testfile.txt");
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "Dummy file content");
      }
    
      const fileDoc = await File.create({
        originalname: "testfile.txt",
        mimetype: "text/plain",
        path: filePath,
        hash: "dummyhash",
        size: fs.statSync(filePath).size,
        filename: "testfile.txt",
        destination: "/uploads",  
        encoding: "7bit",
        fieldname: "file"
      });
    
      const downloadToken = await DownloadToken.create({
        token: "validtoken",
        used: false,
        expiresAt: Date.now() + 60000,
        fileId: fileDoc._id
      });
    
      await User.findOneAndUpdate({ username: "testuser" }, { $push: { files: fileDoc._id } });
    
      const res = await request(app)
        .get(`/files/${downloadToken.token}`)
        .set("Cookie", [`accessToken=${token}`]);
    
      expect(res.status).toBe(200);
      expect(res.headers["mimetype"]).toBe(fileDoc.mimetype);
      expect(res.headers["filename"]).toBe(fileDoc.originalname);
    
      const updatedToken = await DownloadToken.findOne({ token: downloadToken.token });
      expect(updatedToken?.used).toBe(true);
    });
  });

  describe("POST /files/upload-chunk & POST /files/merge-chunks", () => {
    it("should upload chunks and merge them", async () => {
      const chunk1Path = path.join(__dirname, "chunk1.tmp");
      const chunk2Path = path.join(__dirname, "chunk2.tmp");
      fs.writeFileSync(chunk1Path, "Chunk1 Data");
      fs.writeFileSync(chunk2Path, "Chunk2 Data");

      await request(app)
        .post("/files/upload-chunk")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", chunk1Path)
        .field("chunkIndex", 0)
        .field("totalChunks", 2)
        .field("originalName", "mergedFile.txt");

      await request(app)
        .post("/files/upload-chunk")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", chunk2Path)
        .field("chunkIndex", 1)
        .field("totalChunks", 2)
        .field("originalName", "mergedFile.txt");

      const mergeResponse = await request(app)
        .post("/files/merge-chunks")
        .set("Cookie", [`accessToken=${token}`])
        .send({ originalName: "mergedFile.txt", totalChunks: 2 });

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.message).toBe("File merged successfully.");
    });

    it("should return 400 when merging before all chunks are uploaded", async () => {
      const chunk1Path = path.join(__dirname, "chunk1.tmp");
      fs.writeFileSync(chunk1Path, "Chunk1 Data");
    
      await request(app)
        .post("/files/upload-chunk")
        .set("Cookie", [`accessToken=${token}`])
        .attach("file", chunk1Path)
        .field("chunkIndex", 0)
        .field("totalChunks", 2)
        .field("originalName", "incompleteFile.txt");
    
      const mergeResponse = await request(app)
        .post("/files/merge-chunks")
        .set("Cookie", [`accessToken=${token}`])
        .send({ originalName: "incompleteFile.txt", totalChunks: 2 });
    
      expect(mergeResponse.status).toBe(400);
      expect(mergeResponse.body.message).toMatch(/Chunk [0-9]+ is missing/);
    });
  });


  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Test-Database stopped.")
  });
});
