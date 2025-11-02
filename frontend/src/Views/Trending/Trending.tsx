import React from "react";
import Navbar from "../Navbar/Navbar";
import BottomNav from "../BottomNav/BottomNav";
import { getTrendingList } from "../../router/routes"; // Backend-Endpunkt für trending files
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import FileDetailsDialog from "../../components/FileDetailsDialog";
import { getDownloadToken, downloadFile } from "../../router/routes";
import { responsiveFontSizes } from "@mui/material";

const TrendingFiles: React.FC = () => {
  const [trendingFiles, setTrendingFiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

  const handleFileClick = (file: any) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
  };

  const handleDownload = async () => {
    try{
    console.log("Downloading");
    let downloadToken = await getDownloadToken(selectedFile.id)
    await downloadFile(downloadToken.token)
    } catch (err) {
      console.log("Error while downloading file")
    }
  };

  React.useEffect(() => {
    const fetchTrendingFiles = async () => {
      try {
        const files = await getTrendingList();
        console.log("files: ", files);
        const sortedFiles = files.sort(
          (a: any, b: any) => b.likecount - a.likecount
        );
        setTrendingFiles(sortedFiles);
      } catch (err: any) {
        setError("Failed to fetch trending files. Please try again later.");
        console.error("Error fetching trending files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingFiles();
  }, []);

  const podiumHeights = [180, 140, 120];
  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <Box>
      <Box
        sx={{
          width: { xs: "90%", sm: "80%", md: "90%" },
          margin: "100px auto",
          textAlign: "left",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ marginBottom: 2 }}>
          Trending Files
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 4 }}>
          Check out the most liked files from our users!
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography sx={{ color: "red" }}>{error}</Typography>
        ) : trendingFiles.length === 0 ? (
          <Typography>No trending files found.</Typography>
        ) : (
          <Box>
          {/* Podium section */}
          <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 3,
            marginBottom: 10,
            marginTop:20
          }}
        >
          {trendingFiles.slice(0, 3).map((file, index) => (
            <Box
              key={file.id}
              sx={{
                textAlign: "center",
                position: "relative",
              }}
            >
              <Typography
                  variant="h6"
                  sx={{ marginBottom: 1, fontWeight: "bold", color: "#333" }}
                >
                  #{index + 1}
                </Typography>
              <Box
                sx={{
                  backgroundColor: podiumColors[index],
                  height: `${podiumHeights[index]}px`,
                  width: 100,
                  margin: "0 auto",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 1,
                  padding: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                  color: "#fff",
                  fontWeight: "bold",
                  }}
                >
                  {file.likecount} Likes
                </Typography>
              </Box>
              <Card
                onClick={() => handleFileClick(file)}
                sx={{
                  position: "absolute",
                  top: `-${120 + index }px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 100,
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                }}
              >
                <Box
                  component="img"
                  src={file.thumbnail ? file.thumbnail : `/default-thumbnail.png`}
                  alt={`${file.name} thumbnail`}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              </Card>
            </Box>
          ))}
        </Box>
        {/* Other files */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {trendingFiles.slice(3).map((file, place) => (
              <Card
                key={file.id}
                onClick={() => handleFileClick(file)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 1,
                    marginRight: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {place + 4}.
                </Typography>

                <Box
                  component="img"
                  src={file.thumbnail ? file.thumbnail : `/default-thumbnail.png`}
                  alt={`${file.name} thumbnail`}
                  sx={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: "4px",
                    marginRight: 2,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingRight: "10px",
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "normal",
                      lineClamp: 2,
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 1,
                    }}
                  >
                    {file.mimeType}
                  </Typography>
                </Box>
                <FavoriteIcon color="error" />
                <Typography variant="body2">{file.likecount} Likes</Typography>
              </Card>
            ))}
            </Box>
          </Box>
        )}
      </Box>
      <FileDetailsDialog
        open={dialogOpen}
        file={selectedFile}
        onClose={handleCloseDialog}
        onDownload={handleDownload}
      />
      <BottomNav />
    </Box>
  );
};

export default TrendingFiles;
