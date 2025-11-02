const user1Id = ObjectId();
const user2Id = ObjectId();
const user3Id = ObjectId();

const currentDate = new Date();

db.users.insertMany([
  {
    _id: user1Id,
    username: "smb1",
    email: "smb@local.host",
    password: "$2b$10$BgJmkpELYjWdW6jDYlY8I.P4YlJ4003aJZKnD6z100CkmAAHGFRwK", // testuserpassword123!
    files: [],
    fileUploaded: true,
    isGoogleUser: false,
  },
  {
    _id: user2Id,
    username: "smb2",
    email: "smb2@local.host",
    password: "$2b$10$BgJmkpELYjWdW6jDYlY8I.P4YlJ4003aJZKnD6z100CkmAAHGFRwK",
    files: [],
    fileUploaded: true,
    isGoogleUser: false,
  },
  {
    _id: user3Id,
    username: "smb3",
    email: "smb3@local.host",
    password: "$2b$10$BgJmkpELYjWdW6jDYlY8I.P4YlJ4003aJZKnD6z100CkmAAHGFRwK",
    files: [],
    fileUploaded: true,
    isGoogleUser: false,
  },
]);

const file1Id = ObjectId();
const file2Id = ObjectId();
const file3Id = ObjectId();
const file4Id = ObjectId();

db.files.insertMany([
  {
    _id: file1Id,
    fieldname: "file",
    originalname: "user1_file1.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: "/uploads",
    filename: "user1_file1.jpg",
    path: "db/init/files/user1_file1.jpg",
    size: 180417,
    hash: "hash_for_user1_file1",
    thumbnail: "db/init/files/default-thumbnail.png",
    likes: [],
    uploadDate: currentDate,
  },
  {
    _id: file2Id,
    fieldname: "file",
    originalname: "user1_file2.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: "/uploads",
    filename: "user1_file2.jpg",
    path: "db/init/files/user2_file1.jpg",
    size: 147391,
    hash: "hash_for_user1_file2",
    thumbnail: "db/init/files/default-thumbnail.png",
    likes: [],
    uploadDate: currentDate,
  },
  {
    _id: file3Id,
    fieldname: "file",
    originalname: "user2_file1.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: "/uploads",
    filename: "user2_file1.jpg",
    path: "db/init/files/user2_file1.jpg",
    size: 177495,
    hash: "hash_for_user2_file1",
    thumbnail: "db/init/files/default-thumbnail.png",
    likes: [],
    uploadDate: currentDate,
  },
  {
    _id: file4Id,
    fieldname: "file",
    originalname: "user3_file1.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    destination: "/uploads",
    filename: "user3_file1.jpg",
    path: "db/init/files/user3_file1.jpg",
    size: 145370,
    hash: "hash_for_user3_file1",
    thumbnail: "db/init/files/default-thumbnail.png",
    likes: [],
    uploadDate: currentDate,
  },
]);

db.users.updateOne(
    { _id: user1Id },
    {
      $set: {
        files: [file1Id, file2Id],
      },
    }
);

db.users.updateOne(
    { _id: user2Id },
    {
      $set: {
        files: [file3Id],
      },
    }
);

db.users.updateOne(
    { _id: user3Id },
    {
      $set: {
        files: [file4Id],
      },
    }
);

const like1Id = ObjectId();
const like2Id = ObjectId();

db.likes.insertMany([
  {
    _id: like1Id,
    likeDate: currentDate,
    user: user1Id,
  },
  {
    _id: like2Id,
    likeDate: currentDate,
    user: user2Id,
  },
]);

db.files.updateOne(
    { _id: file4Id },
    {
      $set: {
        likes: [like1Id],
      },
    }
);

db.files.updateOne(
    { _id: file2Id },
    {
      $set: {
        likes: [like2Id],
      },
    }
);