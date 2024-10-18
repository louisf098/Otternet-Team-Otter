import { Box } from "@mui/material";
import {TextField} from "@mui/material";
import {Typography, Card, Grid, CardContent, CardActions} from "@mui/material";
import {Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material";
import { useState } from "react";

// dummy data for download demo
const dummyProviders = [
  {walletID: 'Provider1', price: '12 OTTC'}, 
  {walletID: 'Provider2', price: '15 OTTC'}, 
  {walletID: 'Provider3', price: '19 OTTC'}]


const Download = () => {

    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [openModal, setOpenModal] = useState(false);  // Track modal visibility
    const [modalMessage, setModalMessage] = useState("");  // Set Modal Message
    const [modalTitle, setModalTitle] = useState("");  // Set Modal Title
    const [fileHash, setFileHash] = useState(""); // Capture file hash from textfield
    const [providers, setProviders] = useState<{walletID: string; price: string;}[]>([]);


    const handleSearchClick = () => {
      setIsLoading(true)

      setTimeout(() => {
        setProviders(dummyProviders);
        setIsLoading(false);
      }, 2000);
    }

    const handleDownloadClick = (providerID: string) => {
      // Add download logic here
      setModalMessage("File: " + fileHash)
      setModalTitle("Download should begin shortly...")
      setOpenModal(true);
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

        <Button variant="contained" sx={{ mt: 2 }} type="submit" onClick={handleSearchClick}
            disabled={isLoading}>
                {isLoading ? (
            <CircularProgress size={24} /> 
          ) : (
            "Search Providers"
          )}
        </Button>

        <Box sx={{ mt: 4 }}>
        <Grid container spacing={2}>
          {providers.map((provider) => (
              <Grid item xs={12} sm={6} key={provider.walletID}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" flexDirection="column">
                    <Typography variant="h6">WalletID: {provider.walletID}</Typography>
                    <Typography variant="body1">Price: {provider.price}</Typography>
                    </Box>
                    <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => handleDownloadClick(provider.walletID)}
                    >
                      Download
                    </Button>
                  </CardActions>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>

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