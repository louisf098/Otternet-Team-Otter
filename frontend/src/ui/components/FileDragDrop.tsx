import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import "../stylesheets/FileDragDrop.css";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FileWithPath } from "react-dropzone";
import React from "react";

interface FileDragDropProps {
  onFileDrop: (file: File) => void;
}
const FileDragDrop: React.FC<FileDragDropProps> = ({ onFileDrop }) => {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        console.log("Path: ", acceptedFiles[0].path);
        onFileDrop(acceptedFiles[0]); // Send the first file to the parent
      }
    },
  });

  return (
    <div {...getRootProps()} className="dropzone-box">
      <input {...getInputProps()} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }} className="upload-container">
        <CloudUploadIcon fontSize="large" className="upload-icon" />
        <Typography variant="h6">Drag and drop a file here, or click to select a file</Typography>
      </Box>
      <ul>
        {/* {acceptedFiles.map((file: File) => (
          <li key={file.name}>{file.name}</li>
        ))} */}
      {acceptedFiles.length > 0 && (
        <Box sx={{ mt: 2}}>
          <Typography variant="subtitle1">Selected File:</Typography>
          <Typography variant="body2">{acceptedFiles[0].name}</Typography>
        </Box>
      )}
      </ul>
    </div>
  );
}


export default FileDragDrop;
