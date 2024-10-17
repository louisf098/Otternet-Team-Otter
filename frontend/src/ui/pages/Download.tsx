import { Box } from "@mui/material";
import {TextField} from "@mui/material";
import {Typography} from "@mui/material";
import {Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material";
import { useState } from "react";

const Download = () => {

    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [openModal, setOpenModal] = useState(false);  // Track modal visibility
    const [modalMessage, setModalMessage] = useState("");  // Set Modal Message
    const [modalTitle, setModalTitle] = useState("");  // Set Modal Title
    const [fileHash, setFileHash] = useState("") // Capture file hash from textfield


    const handleDownloadClick = () => {
        setIsLoading(true); // Set loading state to true when button is clicked
        
        // Simulate a download or async action (e.g., API call)
        setTimeout(() => {
          setIsLoading(false);

          let validHash = Math.random() < 0.5
          if (validHash){
            setModalMessage("File " + fileHash + " has succesfully been downloaded")
            setModalTitle("DOWNLOAD SUCCESS")
          }
          else{
            setModalMessage('Invalid file hash. Please check your input and try again.')
            setModalTitle("DOWNLOAD FAILURE")
          }

          setOpenModal(true);
          // Add download logic here
        }, 3000);
      };
    
      const handleCloseModal = () => {
        setOpenModal(false);
      }

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
            value = {fileHash}
            onChange = {(e) => setFileHash(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

        <Button variant="contained" sx={{ mt: 2 }} type="submit" onClick={handleDownloadClick}
            disabled={isLoading}>
                {isLoading ? (
            <CircularProgress size={24} /> 
          ) : (
            "Download"
          )}
        </Button>

        </Box>

        <Dialog
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{modalTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {modalMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      </Box>
    );
  };


export default Download;