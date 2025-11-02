
# API Documentation

## Overview
This document provides details for all the backend API endpoints, including their functionality, parameters, input types, and return types.

---

## **Endpoints**

### **1. Get a Random File**
- **URL**: `http://localhost:8080/files/random`
- **Method**: `GET`
- **Description**: Fetches a random file from the database.
- **Parameters**: None
- **Response**:
  - **200 OK**: Returns the details of a random file.
    ```json
    {
      "fieldname": "file",
      "originalname": "example.txt",
      "encoding": "7bit",
      "mimetype": "text/plain",
      "destination": "/uploads",
      "filename": "example123.txt",
      "path": "/uploads/example123.txt",
      "size": 12345,
      "hash": "abc123hash",
      "users": ["userId123"], 
      "uploadDate": "2024-11-17T16:48:54.743+00:00e",
      "likeCount": 10
    }
    ```
  - **404 Not Found**: No files found in the database.
    ```
    No files found
    ```
  - **500 Internal Server Error**: An error occurred while fetching the random file.
    ```
    Error fetching random file
    ```

---

### **2. Get Trending Files**
- **URL**: `http://localhost:8080/files/trending`
- **Method**: `GET`
- **Description**: Fetches the top 10 files with the highest `likeCount`.
- **Parameters**: None
- **Response**:
  - **200 OK**: Returns an array of trending files, sorted by `likeCount` in descending order.
    ```json
    [
      {
      "fieldname": "file",
      "originalname": "example.txt",
      "encoding": "7bit",
      "mimetype": "text/plain",
      "destination": "/uploads",
      "filename": "example123.txt",
      "path": "/uploads/example123.txt",
      "size": 12345,
      "hash": "abc123hash",
      "users": ["userId123"], 
      "uploadDate": "2024-11-17T16:48:54.743+00:00e",
      "likeCount": 10
    },
      ...
    ]
    ```
  - **404 Not Found**: No trending files found.
    ```
    No trending files found
    ```
  - **500 Internal Server Error**: An error occurred while fetching trending files.
    ```
    Error fetching trending files
    ```

---

### **3. Get All Files of a User**
- **URL**: `http://localhost:8080/files/:userId`
- **Method**: `GET`
- **Description**: Fetches all files uploaded by a specific user.
- **Parameters**:
  - **Path Parameter**:
    - `userId` (string): The ID of the user whose files need to be retrieved.
- **Response**:
  - **200 OK**: Returns an array of files uploaded by the user.
    ```json
    [
      {
      "fieldname": "file",
      "originalname": "example.txt",
      "encoding": "7bit",
      "mimetype": "text/plain",
      "destination": "/uploads",
      "filename": "example123.txt",
      "path": "/uploads/example123.txt",
      "size": 12345,
      "hash": "abc123hash",
      "users": ["userId123"], 
      "uploadDate": "2024-11-17T16:48:54.743+00:00e",
      "likeCount": 10
    },
      ...
    ]
    ```
  - **400 Bad Request**: User ID is missing in the request.
    ```
    User ID is required
    ```
  - **404 Not Found**: No files found for the given user.
    ```
    No files found for this user
    ```
  - **500 Internal Server Error**: An error occurred while fetching user files.
    ```
    Error fetching user files
    ```

---

### **4. Upload a File**
- **URL**: `http://localhost:8080/files/upload`
- **Method**: `POST`
- **Description**: Uploads a file to the server and saves its metadata to the database.
- **Parameters**:
  - **Request Body**: Form data containing the file to be uploaded.
    - `file` (file): The file to upload. It must contain the following metadata:
      - `fieldname` (string)
      - `originalname` (string)
      - `encoding` (string)
      - `mimetype` (string)
      - `destination` (string)
      - `filename` (string)
      - `path` (string)
      - `size` (number)
- **Response**:
  - **200 OK**: File uploaded successfully, with a success message.
    ```json
    {
      "message": "File uploaded successfully"
    }
    ```
  - **400 Bad Request**: 
    - If no file is uploaded:
      ```json
      {
        "message": "No file uploaded"
      }
      ```
    - If a required field is missing:
      ```json
      {
        "message": "Missing required field: fieldname"
      }
      ```
  - **500 Internal Server Error**: An error occurred while saving the file metadata.
    ```json
    {
      "error": "Failed to save file metadata"
    }
    ```

---

## **Error Codes**
- **400**: Bad request due to missing parameters or invalid input.
- **404**: Resource not found (e.g., no files available or user has no files).
- **500**: Internal server error due to issues with database or server logic.

---

