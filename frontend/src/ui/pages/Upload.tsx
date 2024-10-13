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
    <div>
      <Box sx={{ m: 1, p: 1 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Upload a File
        </Typography>
          <form onSubmit={handleFormSubmit}>
          <TextField id="outlined-basic" label="Price" variant="outlined" fullWidth sx={{ display: 'block', width: '400px', mb: 2}}/>
          <FormControl fullWidth sx={{ mb: 2}}>
            <FormLabel id="demo-radio-buttons-group-label">Bundle Mode</FormLabel>
            <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue="No bundle"
                name="radio-buttons-group"
              >
                <FormControlLabel value="Bundled" control={<Radio />} label="Bundle" />
                <FormControlLabel value="No bundle" control={<Radio />} label="No bundle" />
              </RadioGroup>
          </FormControl>
          <FileDragDrop onFileDrop={handleFileDrop}/>
          <TextField id="outlined-basic" label="File Name"sx={{ display: 'block', mb: 2, mt: 2}} fullWidth value={fileName} onChange={(e) => setFileName(e.target.value)}/>
          <Button variant="contained" sx={{ mt: 1 }} type="submit" fullWidth>
            Submit
          </Button>
        </form>
      </Box>
    </div>
  );
};

export default Upload;
