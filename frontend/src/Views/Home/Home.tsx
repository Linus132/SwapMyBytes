import React, { useState, useCallback, useEffect } from "react";
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  LinearProgress, 
  CardContent, 
  Card, 
  CircularProgress, 
  Slide, 
  Fade, 
  Link, 
  IconButton, 
  useTheme, 
  Collapse 
} from "@mui/material";
import { getRandomFile, fileUpload, downloadFile, getDownloadToken, fetchWithTokenRefresh, baseUrl } from "../../router/routes";
import { useNavigate } from "react-router-dom";
import { DropzoneArea } from 'react-mui-dropzone';
import "./Home.css";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";

const apiUrl = import.meta.env.VITE_BACKEND_LOCATION;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchWithTokenRefresh(`${baseUrl}user/auth/status`, {
          method: "GET",
          credentials: "include",
        });
        if (response.status === 401) {
          navigate("/login");
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking auth status", error);
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <div data-testid="home-view">
      <Container>
        <FileUpload setIsFileUploaded={setIsFileUploaded} />
      </Container>
    </div>
  );
};

// File Upload Component
export const FileUpload: React.FC<{
  setIsFileUploaded: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setIsFileUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"ready" | "sending" | "sent">(
    "ready"
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showFileDownload, setShowFileDownload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handling file selection
  const handleOnChange = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setUploadError(null); // Clear any previous errors
    }
    // Hide upload button, when user deletes the file in the drop zone
    if (files.length === 0) {
      setFile(null);
    }
  };

  // Handler for Formular-Submit
  const handleOnSubmit = useCallback(async () => {
    if (!file) {
      console.error("No file selected");
      return;
    }

    setUploadState("sending");
    setShowProgressBar(true);

    try {
      await fileUpload(file, (progress: number) => setUploadProgress(progress));
      setTimeout(() => {
        setUploadState("sent");
        setShowProgressBar(false);
        setIsFileUploaded(true);
        setShowFileDownload(true);
      }, 200);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Error uploading file. Please try again.");
      setIsFileUploaded(false);
      setShowProgressBar(false);  
    }
  },
    [file, setIsFileUploaded]
  );

  return (
    <Box
      sx={{
        width: { xs: '80%', sm: '75%', md: '65%', lg: '55%' },
        maxWidth: 600,
        margin: "80px auto",
        padding: "16px",
        height: 'auto',
      }}
    >
      {uploadState !== "sent" && (
        <>
          <AppInfoBox />
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ color: "rgb(28, 28, 28)", fontWeight: "bold", marginBottom: 1, }}
          >
            Upload & Unwrap a Random File
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="textSecondary"
            sx={{ marginBottom: 3 }}
          >
            Supported formats: audio, video, image, text and application.
          </Typography>
        </>
      )}
      {uploadState === "ready" && (
        <>
        <div data-testid="dropzone">
          <DropzoneArea
            onChange={handleOnChange}
            acceptedFiles={[
              "audio/*",
              "video/*",
              "image/*",
              "application/*",
              "text/plain",
            ]}
            filesLimit={1}
            maxFileSize={20000000} // 20MB
            dropzoneText="Drag & drop or click to upload"
            showPreviewsInDropzone={true}
            showFileNames={true}
            showAlerts={true}
            dropzoneClass="custom-dropzone"
            dropzoneParagraphClass="custom-dropzone-text"
          />
          </div>
          {file && (
            <Button
              variant="contained"
              onClick={handleOnSubmit}
              sx={{ 
                fontSize: "12px",
                padding: "6px 16px",
                marginTop: 2, 
                borderRadius: "8px",
                color:  "white",
                backgroundColor:  "rgb(48, 91, 184)",
                fontWeight: "bold", 
                "&:hover": {
                backgroundColor: "rgba(48, 91, 184, 0.9)",
                "&.MuiButton-root": {
                  fontSize: "12px",
                  padding: "6px 16px",
                },
              },
              }}
            >
              Upload
            </Button>
          )}
        </>
      )}
      { (uploadState === 'sending' || uploadState === "sent") && (
          <Fade in={showProgressBar} timeout={500}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 2,
                marginTop: 2,
                height: showProgressBar ? "auto" : 0,
                transition: "height 0.5s ease", 
              }}
            >
            <Typography
              variant="body2"
              align="center"
              color={uploadState === "sent" ? "success.main" : "primary"}
              sx={{ 
                marginBottom: 2, 
                opacity: showProgressBar ? 1 : 0, 
                transition: "opacity 0.5s ease" 
              }}
            >
              {uploadState === "sending"
                ? `Uploading... ${uploadProgress}%`
                : "Upload Complete!"}
            </Typography>
            <LinearProgress
              data-testid="upload-progress"
              variant="determinate"
              value={uploadProgress}
              sx={{
                width: "100%",
                height: "10px",
                borderRadius: "5px",
                backgroundColor: "#e0e0e0",
                transition: "height 0.5s ease, opacity 0.5s ease",
              }}
            />
          </Box>
        </Fade>
      )}
      {uploadError && (
            <Typography
              variant="body2"
              align="center"
              color="error"
              sx={{ marginTop: 2 }}
            >
              {uploadError}
            </Typography>
          )}
      <Slide direction="up" in={showFileDownload} mountOnEnter unmountOnExit>
        <Box
            textAlign="center"
            sx={{
              marginTop: 2,
            }}
          >
            <CheckCircleOutlineIcon
              fontSize="large"
              sx={{
                color: "#2e7d32",
                transition: "all 0.5s ease",
                transform: "scale(1.2)",
              }}
            />
            <Typography
              variant="h6"
              align="center"
              color="success.main"
              sx={{ marginTop: 2 }}
            >
              Upload successful! 🎉
            </Typography>
            <Typography variant="body1" color="textSecondary" marginTop={1}>
              You can find your assigned files in the{" "}
              <Link
                onClick={() => navigate("/files")}
                sx={{
                  cursor: "pointer",
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline", },
                }}
              >
                Files
              </Link>{" "}
              page.
            </Typography>

            <RandomFileDownload />
            
          </Box>
      </Slide>
    </Box>
  );
};

// File Download Component
export const RandomFileDownload: React.FC = () => {
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDownload = async () => {
    if (!downloadToken) {
      console.error("Download token is missing");
      return;
    }
    setIsDownloading(true);
    setError(null);
    try {
      await downloadFile(downloadToken);
      setIsDownloading(false);
      navigate('/files')
    } catch (error) {
      console.error('Error downloading file:', error);
      setError((error as Error).message || "An unknown error occured");
    }
  };
  
  useEffect(() => {
    const fetchFileId = async () => {
      try {
        setError(null);

        const file = await getRandomFile();

        const downloadTokenResponse = await getDownloadToken(file);

        if (!downloadTokenResponse || !downloadTokenResponse.token) {
          console.error("Failed to get a valid download token.");
          return;
        }

        setDownloadToken(downloadTokenResponse.token)

      } catch (err) {
        console.error("Error fetching file ID:", err);
        setError("Failed to fetch the file. Please try again.");
      }
    };
    fetchFileId();
  }, []);

  let content;

  if (error) {
    content = (
      <Box textAlign="center" sx={{ marginBottom: 3 }}>
        <ErrorOutlineIcon
          fontSize="large"
          sx={{ color: "error.main", marginBottom: 1 }}
        />
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      </Box>
    );
  } else if (isDownloading) {
    content = (
      <Box textAlign="center" sx={{ marginTop: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ marginTop: 1 }}>
          Your download is in progress...
        </Typography>
      </Box>
    );
  } else if (downloadToken) {
    content = (
      <>
        <Typography
          variant="body2"
          align="center"
          color="textSecondary"
          sx={{ marginBottom: 3 }}
        >
          Click the button below to download the random file.
        </Typography>
        <Box textAlign="center">
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleDownload}
            disabled={isDownloading}
            sx={{ 
              color: "white",
              backgroundColor: "rgb(48, 91, 184)",
              padding: "10px 20px", 
              borderRadius: "8px",
              "&:hover": {
              backgroundColor: "rgba(48, 91, 184, 0.9)",
            },
            }}
          >
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </Box>
      </>
    );
  }
  
  return (
    <Card
      sx={{
        maxWidth: 600,
        margin: "40px auto",
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        padding: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ color: "rgb(28, 28, 28)", fontWeight: "bold" }}
        >
          Who Knows What You'll Get? 🤩
        </Typography>
        {content}
      </CardContent>
    </Card>
  );
};

const AppInfoBox: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();

  // Show the info box only for first-time users
  useEffect(() => {
    const hasSeenInfoBox = localStorage.getItem("infoBoxSeen");
    if (!hasSeenInfoBox) {
      setIsVisible(true); 
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("infoBoxSeen", "true");
  };

  if (!isVisible) return null;

  return (
    <Fade in={isVisible} timeout={500}>
      <Collapse in={isVisible} timeout={500}>
        <Card
          sx={{
            backgroundColor: "rgb(210, 236, 245)",
            color: "rgb(28, 28, 28)",
            borderRadius: "15px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
            padding: "10px",
            position: "relative",
            marginBottom: 5,
            overflow: "hidden",
            gap: "8px",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "rgb(28, 28, 28)",
            }}
          >
            <CloseIcon />
          </IconButton>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              gap: 2,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <InfoIcon
              fontSize="large"
              sx={{
                color: "rgb(28, 28, 28)",
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  marginBottom: 1,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                Welcome to SwapMyBytes!
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.5,
                  fontSize: { xs: "0.85rem", sm: "0.92rem" },
                }}
              >
                Upload a file and get a random one in return. Liked files may appear
                on the leaderboard. Share something cool and see if it becomes a
                hit!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Collapse>
    </Fade>
  );
};

export default Home;
