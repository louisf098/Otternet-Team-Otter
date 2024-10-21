import React, { useEffect, useState, } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { FormData } from "../interfaces/File";
import { FormControl, MenuItem, Select, TextField, Tooltip, SelectChangeEvent, IconButton, Menu,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, 
 } from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface UploadHistoryTableProps {
  setSnackbarOpen: (open: boolean) => void;
  setSnackbarMessage: (message: string) => void;
  handleCopy: (text: string) => void;
}

const UploadHistoryTable: React.FC<UploadHistoryTableProps> = ({ setSnackbarOpen, setSnackbarMessage, handleCopy }) => {
  const [uploads, setUploads] = useState<FormData[]>([]);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = React.useState<string | null>(null);
  
  const [editRowId, setEditRowId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{
    fileName: string;
    price: number;
    bundleMode: boolean;
  }>({
    fileName: "",
    price: 0,
    bundleMode: false,
  });

  const [editErrors, setEditErrors] = React.useState<{
    price: boolean,
    fileName: boolean
  }>({
    price: false,
    fileName: false,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFileHash, setDeleteFileHash] = useState<string | null>(null);
  const openDeleteConfirm = (fileHash: string) => {
    setDeleteFileHash(fileHash);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteFileHash(null);
    setDeleteConfirmOpen(false);
  };

  useEffect(() => {
    fetchUploads();
  }, []);
  
  const fetchUploads = async () => {
    // fetch all uploads
    const response = await fetch("http://localhost:9378/getUploads", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status === 404) {
      setSnackbarMessage("No upload history found");
      setSnackbarOpen(true);
      return;
    }
    const data = await response.json();
    setUploads(data);
  };


  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, fileHash: string) => {
    setAnchor(event.currentTarget);
    setMenuRowId(fileHash);
  };

  const handleMenuClose = () => {
    setAnchor(null);
    setMenuRowId(null);
  };

  const handleEdit = (upload: FormData) => {
    setEditRowId(upload.fileHash);
    setEditValues({
      fileName: upload.fileName,
      price: upload.price,
      bundleMode: upload.bundleMode,
    });
    handleMenuClose();
  }

  const handleCancelEdit = () => {
    setEditRowId(null);
  }

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setEditErrors((prev) => ({
      ...prev,
      [name]: value.length < 3,
    }));
  }

  const handleTextNumChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const numValue = parseFloat(value);
    setEditValues((prev) => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue,
    }));
    setEditErrors((prev) => ({
      ...prev,
      [name]: isNaN(numValue) || numValue < 0,
    }));
  }

  const handleSelectChange = (event: SelectChangeEvent<"on" | "off">) => {
    const { name, value } = event.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: value === "on",
    }));
  };

  // send changes to backend
  const handleSaveEdit = async (fileHash: string) => {
    const uploadIndex = uploads.findIndex((upload) => upload.fileHash === fileHash);
    if (uploadIndex === -1) return;
    const updatedUpload = {
      ...uploads[uploadIndex],
      fileName: editValues.fileName,
      price: editValues.price,
      bundleMode: editValues.bundleMode,
    };

    // send updated upload to backend
    try {
      const response = await fetch("http://localhost:9378/uploadFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUpload),
      })
      if (!response.ok) {
        throw new Error("Failed to update upload");
      }
      const data = await response.json();
      const updatedUploads = [...uploads];
      updatedUploads[uploadIndex] = data;
      await fetchUploads();
      setEditRowId(null);
      setSnackbarMessage("Upload updated successfully");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error updating upload: ", err);
      setSnackbarMessage("Error updating upload. Please try again later.");
      setSnackbarOpen(true);
    }
  }

  const handleDelete = async (fileHash: string) => {
    try {
      const response = await fetch(`http://localhost:9378/deleteFile/${fileHash}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      setUploads(uploads.filter((upload) => upload.fileHash !== fileHash));
      setSnackbarMessage("File deleted successfully");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error deleting file: ", err);
      setSnackbarMessage("Error deleting file. Please try again later.");
      setSnackbarOpen(true);
    } finally {
      closeDeleteConfirm();
    }
  };

  return (
    <>
      <Dialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle id="delete-dialog-title">Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleDelete(deleteFileHash!)} color="secondary" autoFocus> {/* ! so that TS doesn't complain!!! */}
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 1,
          maxHeight: 600,
        }}
      >
        <Table 
          sx={{ minWidth: 500 }} 
          aria-label="simple table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Size (KB)</TableCell>
              <TableCell>Cost (OTTC)</TableCell>
              <TableCell>Bundle Mode</TableCell>
              <TableCell>
                File Hash
                <Tooltip title="Click hash to copy to your clipboard" arrow>
                  <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1 } } />
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  You have not uploaded any files yet
                </TableCell>
              </TableRow>
            ) : (
              uploads.map((upload) => (
                <TableRow
                  key={upload.fileHash}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    handleEdit(upload);
                  }}
                >
                  <TableCell component="th" scope="row">
                    {upload.timestamp}
                  </TableCell>
                  <TableCell>
                    {editRowId === upload.fileHash ? (
                      <TextField
                        name="fileName"
                        value={editValues.fileName}
                        onChange={handleTextChange}
                        size="small"
                        variant="standard"
                        error={editErrors.fileName}
                        helperText={editErrors.fileName ? "Name must be ≥ 3 characters" : ""}
                      />
                    ):(
                      upload.fileName
                    )}
                  </TableCell>
                  <TableCell>{upload.fileSize / 1000}</TableCell>
                  <TableCell>
                    {editRowId === upload.fileHash ? (
                      <TextField
                        name="price"
                        type="number"
                        value={editValues.price}
                        onChange={handleTextNumChange}
                        size="small"
                        variant="standard"
                        error={editErrors.price}
                        helperText={editErrors.price ? "Price must be ≥ 0" : ""}
                      />
                    ):(
                      upload.price
                    )}
                    
                  </TableCell>
                  <TableCell>
                    {editRowId === upload.fileHash ? (
                      <FormControl variant="standard">
                        <Select
                          name="bundleMode"
                          value={editValues.bundleMode ? "on" : "off"}
                          onChange={handleSelectChange}
                          size="small"
                          variant="standard"
                        >
                          <MenuItem value="on">On</MenuItem>
                          <MenuItem value="off">Off</MenuItem>
                        </Select>
                      </FormControl>
                    ):(
                      upload.bundleMode ? "On" : "Off"
                    )}
                    

                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 200,
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCopy(upload.fileHash)}  
                  >
                    <Tooltip title="Click to copy" arrow>
                      <span>{upload.fileHash}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {editRowId === upload.fileHash ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleSaveEdit(upload.fileHash)}
                          disabled={editErrors.fileName || editErrors.price}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          onClick={handleCancelEdit}
                        >
                          <CancelIcon />
                        </IconButton>
                      </div>
                    ) : (
                      <div>
                        <IconButton onClick={(event) => handleMenuOpen(event, upload.fileHash)}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchor}
                          open={menuRowId === upload.fileHash}
                          onClose={handleMenuClose}
                          anchorOrigin={{
                            vertical: "top",
                            horizontal: "left",
                          }}
                          transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                          }}
                        >
                          <MenuItem onClick={() => handleEdit(upload)}>Edit</MenuItem>
                          <MenuItem onClick={() => openDeleteConfirm(upload.fileHash)}>Delete</MenuItem>
                        </Menu>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default UploadHistoryTable;
