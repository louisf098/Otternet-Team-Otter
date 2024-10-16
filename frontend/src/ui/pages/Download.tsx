import { Box } from "@mui/material";
import {TextField} from "@mui/material";
import {Typography} from "@mui/material";
import {Button} from "@mui/material";

const Download = () => {
    return (
        <Box
        sx={{
          width: '100%',             
          maxWidth: '800px',         
          m: '0 auto',               
          p: 2,                      
          textAlign: 'center', 
          }}
        >
        <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '800px' }}>  {/* Adjust form size here */}
        <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
          Download File
        </Typography>
          <TextField
            id="outlined-hash"
            label="Input File Hash Here"
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
          />

        <Button variant="contained" sx={{ mt: 2 }} type="submit">
            Download
        </Button>

        </Box>
      </Box>
    );
  };


export default Download;