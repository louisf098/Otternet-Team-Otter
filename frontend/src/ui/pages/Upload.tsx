import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import FileDragDrop from "../components/FileDragDrop";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

interface FormData {
  userID: string,
  price: number,
  fileName: string,
  file: File,
  bundleMode: boolean
}
interface UploadProps{}

const Upload: React.FC<UploadProps> = () => {

   //UseState to hold the file added
   const [file, setFile] = useState<File | null>(null);
   const [fileName, setFileName] = useState<string>('');

   const handleFileDrop = (droppedFile: File) => {
    setFile(droppedFile);
    setFileName(droppedFile.name);
   }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // FormData wrap the data
    const formData = new FormData(event.currentTarget);
    // Check if a file was selected
    if (file) {
      formData.append('file', file);
    } else {
      console.error("No file was selected");
      return;
    }

    // Axios request
    try {
      const response = await fetch("http://localhost:8080/uploadFile", {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!data) {
        throw new Error('The POST request to the backend failed.')
      }
      console.log("Successfully uploaded file to DHT.", data);

    } catch(err) {
      console.error("An error occurred when attempting to upload the file.")
    }

  }
  return (
    <Box
    sx={{
      width: '100%',             
      maxWidth: '500px',         
      m: '0 auto',               
      p: 2,                      
      textAlign: 'center', 
      }}
    >
      <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '500px' }}>  {/* Adjust form size here */}
        <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
          Upload a File
        </Typography>
        <form onSubmit={handleFormSubmit}>
          <TextField
            id="outlined-price"
            label="Price"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel id="bundle-mode-label">Bundle Mode</FormLabel>
            <RadioGroup
              aria-labelledby="bundle-mode-label"
              defaultValue="No bundle"
              name="radio-buttons-group"
            >
              <FormControlLabel value="Bundled" control={<Radio />} label="Bundle" />
              <FormControlLabel value="No bundle" control={<Radio />} label="No bundle" />
            </RadioGroup>
          </FormControl>

          <FileDragDrop onFileDrop={handleFileDrop} />

          <TextField
            id="outlined-file-name"
            label="File Name"
            fullWidth
            sx={{ mb: 2, mt: 2 }}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />

          <Button variant="contained" sx={{ mt: 2 }} type="submit" fullWidth>
            Submit
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Upload;
