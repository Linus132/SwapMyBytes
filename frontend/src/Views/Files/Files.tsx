import * as React from "react";
import { deleteFile, getAllFilesOfUser, likeFile } from "../../router/routes";
import Navbar from "../Navbar/Navbar";
import BottomNav from "../BottomNav/BottomNav";
import FileDetailsDialog from "../../components/FileDetailsDialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Delete } from "@mui/icons-material";
import { ListItemIcon } from "@mui/material";
import { getDownloadToken, downloadFile } from "../../router/routes";
import TextField from "@mui/material/TextField";

const Files: React.FC = () => {
  const [files, setFiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedFileId, setSelectedFileId] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const userId = localStorage.getItem("userId");

  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const userFiles = await getAllFilesOfUser();
        const sortedFiles = userFiles.sort(
          (a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
  
        setFiles(sortedFiles);
      } catch (err: any) {
        setError("Failed to fetch files. Please try again later.");
        console.error("Error fetching user files:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const filteredFiles = React.useMemo(() => {
    return searchTerm
      ? files.filter((file) =>
        file.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
      : files;
  }, [files, searchTerm]);


  const handleLikeFile = async (fileId: string) => {
    try {
      await likeFile(fileId, userId!);
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? { ...file, hasUserLike: !file.hasUserLike }
            : file
        )
      );
    } catch (err: any) {
      console.error("Error liking file:", err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, fileId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedFileId(fileId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedFileId(null);
  };

  const handleDeleteFile = async () => {
    if (!selectedFileId) return;
    try {
      await deleteFile(selectedFileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== selectedFileId));
    } catch (err) {
      console.error("Error deleting file:", err);
    } finally {
      handleMenuClose();
    }
  };

  const handleFileClick = (file: any) => {
    setSelectedFile(file);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedFile(null);
    setDialogOpen(false);
  };

  const handleDownload = async () => {
    try{
        console.log("Downloading", selectedFile.name);
        let downloadToken = await getDownloadToken(selectedFile.id)
        await downloadFile(downloadToken.token)
        } catch (err) {
          console.log("Error while downloading file")
        }
  };

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
          My Files
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 4 }}>
          Hello, here are your files.
        </Typography>
        <TextField
          label="Search files"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ marginBottom: 4 }}
        />
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography sx={{ color: "red" }}>{error}</Typography>
        ) : files.length === 0 ? (
          <Typography>No files found.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr 1fr 1fr",
                md: "1fr 1fr 1fr 1fr 1fr",
              },
              gap: 2,
            }}
          >
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "row", sm: "column" },
                  width: "100%",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => handleFileClick(file)}
              >
                <Box
                  component="img"
                  src={file.thumbnail ? file.thumbnail : `/default-thumbnail.png`}
                  alt={`${file.name} thumbnail`}
                  sx={{
                    width: { xs: 60, sm: "100%" },
                    height: { xs: 60, sm: "auto" },
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    padding: 1,
                    display: "flex",
                    paddingRight: { xs: "70px", sm:  "20px"},
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "left",
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
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {file.name}
                  </Typography>
                </Box>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeFile(file.id);
                  }}
                  sx={{
                    position: "absolute", 
                    top:  { xs: 10, sm: 8 },
                    right: { xs: 30, sm: 8 },
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.7)",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  {file.hasUserLike ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton
                  onClick={(event) => {
                    handleMenuOpen(event, file.id)
                    event.stopPropagation();
                  }}
                  sx={{
                    position: "absolute",
                    bottom: { xs: 10, sm: 5 },
                    right: { xs: 8, sm: 5 },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Card>
            ))}
          </Box>
        )}
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteFile}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      <BottomNav />
      <FileDetailsDialog
        open={dialogOpen}
        file={selectedFile}
        onClose={handleCloseDialog}
        onDownload={() => handleDownload()}
      />
    </Box>
  );
};

export default Files;
