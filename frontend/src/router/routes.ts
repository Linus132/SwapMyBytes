const apiUrl = import.meta.env.VITE_BACKEND_LOCATION;

export const baseUrl = `http://${apiUrl}/`;

export const fetchWithTokenRefresh = async (url: string, options: RequestInit) => {
  try {
    let response = await fetch(url, options);

    if (response.status === 401) {
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        response = await fetch(url, options);
      } else {
        window.location.href = "/login";
      }
    }

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`${errorMessage}. Status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
};

const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${baseUrl}user/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return true;
  } catch (error) {
    console.error("Session expired, please log in again.");
    return false;
  }
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<any> => {
  try {
    const response = await fetch(`${baseUrl}user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Registration failed: ${errorMessage}`);
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Failed to parse response JSON.");
    }
  } catch (error) {
    console.error("Registration Failed:", error);
    throw error;
  }
};

export const fileUpload = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<any> => {
  const chunkSize = 1024 * 1024;

  if (file.size <= chunkSize) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithTokenRefresh(`${baseUrl}files/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    onProgress(100);
    return;
  }

  const totalChunks = Math.ceil(file.size / chunkSize);
  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("chunkIndex", index.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("originalName", file.name);

    const response = await fetchWithTokenRefresh(`${baseUrl}files/upload-chunk`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${index}: ${response.statusText}`);
    }

    const progress = Math.round(((index + 1) / totalChunks) * 100);
    onProgress(progress);
  }

  // Merge chunks after upload
  const mergeResponse = await fetchWithTokenRefresh(`${baseUrl}files/merge-chunks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      originalName: file.name, 
      totalChunks 
    }),
    credentials: "include",
  });

  if (!mergeResponse.ok) {
    throw new Error(`Failed to merge chunks: ${mergeResponse.statusText}`);
  }

  console.log("File uploaded and merged successfully.");
};

export const getRandomFile = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${baseUrl}files/random`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `File Upload was not succesful. Status: ${response.status}`
      );
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Failed to parse response JSON.");
    }
  } catch (error) {
    console.error("Something went wrong with getting a random file", error);
    throw error;
  }
};

export const getDownloadToken = async (fileId: string) => {
  try{
    console.log("Trying to get download token from backend.")
    const response = await fetchWithTokenRefresh(`${baseUrl}files/generate-download`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({fileId})
    });

    if (!response.ok) {
      throw new Error(
        `File download was not succesful. Status: ${response.status}`
      );
    }
    const downloadToken = await response.json()
    console.log(downloadToken)
    return downloadToken

  } catch(err){
    console.log(`Something went wrong with creating a download token: ${err}`)
    return
  }
}

export const downloadFile = async (downloadToken: string) => {
  try {
    const response = await fetchWithTokenRefresh(`${baseUrl}files/${downloadToken}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `${await response.json()}. Status: ${response.status}`
      );
    }

    const blob = await response.blob();

    let fileType = response.headers.get("mimetype");
    let fileName = response.headers.get("filename");

    if (!fileType) {
      fileType = "application/octet-stream"; // Standard MIME-Type für Binärdaten
    }

    if (!fileName) {
      fileName = "downloaded_file"; // Fallback-Name
    }

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;

    link.download = fileName;
    link.type = fileType;

    link.click();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Something went wrong with downloading the file.", error);
    throw new Error("Failed to download file.");
  }
};

export const getTrendingList = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${baseUrl}files/trending`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Response from Server is not OK. Status: ${response.status}`
      );
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Failed to parse response JSON.");
    }
  } catch (error) {
    console.error(
      "Something went wrong with getting the trending files",
      error
    );
    throw error;
  }
};

export const getAllFilesOfUser = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${baseUrl}files/user`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Get Files of User was not succesful. Status: ${response.status}`
      );
    }

    try {
      const fileData = await response.json();
      return fileData.map((file: { id: string; name: string; thumbnail: string; hasUserLike: boolean, mimeType: string, likecount: number, uploadDate: string}) => ({
        id: file.id,
        name: file.name,
        thumbnail: file.thumbnail,
        mimeType:  file.mimeType,
        uploadDate: file.uploadDate,
        likecount: file.likecount,
        hasUserLike: file.hasUserLike,
      }));
    } catch (parseError) {
      throw new Error("Failed to parse response JSON.");
    }
  } catch (error) {
    console.error(
      "Something went wrong with getting the files of the User",
      error
    );
    throw error;
  }
};

export const LoginUser = async (username: string, password: string) => {
  try {
    const response = await fetch(`${baseUrl}user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorMessage = await response.json();
      throw new Error(errorMessage.error);
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Failed to parse response JSON.");
    }
  } catch (error) {
    console.error("Login Failed:", error);
    throw error;
  }
};

export const LogoutUser = async () => {
  try {
    const response = await fetch(`${baseUrl}user/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Logout failed with status: ${response.status}`);
    }

    return await response.json(); 
  } catch (error) {
    console.error("Failed to logout user:", error);
    throw error;
  }
};

export const likeFile = async (fileId : string, userId : string) => {
    try {
        const response = await fetchWithTokenRefresh(`${baseUrl}files/like/${fileId}`, {
            method: 'PATCH',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
            credentials: "include",
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`like Event failed: ${errorMessage}`);
        }
        try {
            return await response.json();
        } catch (parseError) {
            throw new Error('Failed to parse response JSON.');
        }
    }catch (error) {
        console.error('like Event Failed:', error);
        throw error;
    }   
};

export const deleteFile = async (fileId : string) => {
  try {
      const response = await fetchWithTokenRefresh(`${baseUrl}files/${fileId}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
      });

      if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Delete Event failed: ${errorMessage}`);
      }
      try {
          return await response.json();
      } catch (parseError) {
          throw new Error('Failed to parse response JSON.');
      }
  }catch (error) {
      console.error('Delete Event Failed:', error);
      throw error;
  }   
};
