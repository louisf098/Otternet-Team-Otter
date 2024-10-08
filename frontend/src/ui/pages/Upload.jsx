import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import FileDragDrop from "../components/FileDragDrop";

const Upload = () => {
  return (
    <Box sx={{ m: 1, p: 1 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Upload
      </Typography>
      <FileDragDrop />
      <Button variant="contained" component="label" sx={{ mt: 1 }}>
        Upload File <input type="file" hidden />
      </Button>
    </Box>
  );
};

export default Upload;
