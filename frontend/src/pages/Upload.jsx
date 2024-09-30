import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import FileDragDrop from "../components/FileDragDrop";

const Upload = () => {
  return (
    <div>
    <Box sx={{ p: 1 }}>
      <Typography variant="h4">Upload</Typography>
    </Box>
    <FileDragDrop/>
    <Button variant="contained" component="label"> Upload File <input type="file" hidden/></Button>
  </div>
  )
}

export default Upload;