import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import '../stylesheets/FileDragDrop.css'; 

function FileDragDrop() {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone();

  return (
    <div {...getRootProps()} className="dropzone-box">
      <input {...getInputProps()} />
      <div className="upload-container">
        <CloudUploadIcon fontSize="large" className="upload-icon" />
        <p>Drag and drop some files here, or click to select files</p>
      </div>
      <ul>
        {acceptedFiles.map((file) => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default FileDragDrop;