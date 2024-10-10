import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import "../stylesheets/FileDragDrop.css";
import React from "react";

interface FileDragDropProps {
  onFileDrop: (file: File) => void;
}
const FileDragDrop: React.FC<FileDragDropProps> = ({ onFileDrop }) => {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0]); // Send the first file to the parent
      }
    },
  });

  return (
    <div {...getRootProps()} className="dropzone-box">
      <input {...getInputProps()} />
      <div className="upload-container">
        <CloudUploadIcon fontSize="large" className="upload-icon" />
        <p>Drag and drop some files here, or click to select files</p>
      </div>
      <ul>
        {acceptedFiles.map((file: File) => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}


export default FileDragDrop;
