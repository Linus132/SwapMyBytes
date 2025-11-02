import React from "react";
import { Box, Typography, IconButton, Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FileDetailsDialogProps {
  open: boolean;
  file: any | null; 
  onClose: () => void;
  onDownload: (file: any) => void;
}

const FileDetailsDialog: React.FC<FileDetailsDialogProps> = ({ open, file, onClose, onDownload }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent
        sx={{
          padding: 2,
          position: "relative",
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        {file && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 3,
            }}
          >
            {/* Detail: File Name */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                File Name:
              </Typography>
              <Typography variant="body2">{file.name}</Typography>
            </Box>

            {/* Detail: File Type */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                File Type:
              </Typography>
              <Typography variant="body2">{file.mimeType}</Typography>
            </Box>

            {/* Detail: Like Count */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Likes:
              </Typography>
              <Typography variant="body2">{file.likecount}</Typography>
            </Box>

            {/* Detail: Uploaded Date */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Uploaded:
              </Typography>
              <Typography variant="body2">
                {new Date(file.uploadDate).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          padding: 2,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={() => onDownload(file)}
          variant="contained"
          color="primary"
        >
          Download File
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileDetailsDialog;
