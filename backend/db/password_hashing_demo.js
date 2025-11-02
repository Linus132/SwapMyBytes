const bcrypt = require("bcrypt");

const fs = require("fs");
const path = require("path");

// Directory containing files
const filesDir = path.join(__dirname, "./init/files");

const getFileData = (filename) => {
  const filePath = path.join(filesDir, filename);
  try {
    const stats = fs.statSync(filePath);
    return {
      filename,
      path: filePath.replace(__dirname, ""), // Relative path
      size: stats.size,
    };
  } catch (error) {
    console.error(`Error reading file: ${filename}`, error);
    return null;
  }
};

const files = [
  "user1_file1.jpg",
  "user2_file1.jpg",
  "user2_file2.jpg",
  "user3_file1.jpg",
];

// Generate file data
const fileData = files.map((file) => getFileData(file)).filter(Boolean);

console.log(JSON.stringify(fileData, null, 2));

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

(async () => {
  const password1 = await hashPassword("testuserpassword123!");
  const password2 = await hashPassword("adminpassword123!");

  console.log("Hashed Passwords:");
  console.log(`Test User: ${password1}`);
  console.log(`Admin: ${password2}`);
})();

