import { Box } from "@mui/material";
import {TextField} from "@mui/material";
import {Typography, Card, Grid, CardContent, CardActions} from "@mui/material";
import {Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions} from "@mui/material";
import { useState } from "react";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

// dummy data for download demo
const dummyProviders = [
  {walletID: 'e0d123e5f316bef78bfdf5a008837577', price: '12 OTTC'}, 
  {walletID: '95982461e7db28fb0d0ea25bd2fc9d7f', price: '15 OTTC'}, 
  {walletID: '06adac43bac94634b3773f13296cf6d9', price: '19 OTTC'}]

  const dummyFileDetails = {
    name: "Cookie_Monster_Script",
    type: "Text Document(.txt)",
    size: "17.4 MB"
  };

const Download = () => {

    const [isLoading, setIsLoading] = useState(false); // Track loading state
    const [openModal, setOpenModal] = useState(false);  // Track modal visibility
    const [modalMessage, setModalMessage] = useState("");  // Set Modal Message
    const [modalTitle, setModalTitle] = useState("");  // Set Modal Title
    const [fileHash, setFileHash] = useState(""); // Capture file hash from textfield
    const [searchedHash, setSearchedHash] = useState(""); // Store file hash from textfield
    const [providers, setProviders] = useState<{walletID: string; price: string;}[]>([]);
    const [fileDetails, setFileDetails] = useState<{name: string; type: string; size: string;} | null >(null);

    const handleSearchClick = () => {
      setIsLoading(true)

      setTimeout(() => {
        setProviders(dummyProviders);
        setSearchedHash(fileHash);
        setFileDetails(dummyFileDetails);
        setIsLoading(false);
      }, 2000);
    }

    const handleDownloadClick = () => {
      // Add download logic here
      setModalMessage("Download should begin shortly...")
      setModalTitle("Transaction successful!")
      setOpenModal(true);
    };

    const handleCloseModal = () => {
      setOpenModal(false);
    }

    return (
        <Box
        sx={{
          width: '100%',             
          maxWidth: '1000px',         
          m: '0 auto',               
          p: 2,                      
          textAlign: 'center', 
          }}
        >
        <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '1000px' }}>  {/* Adjust form size here */}
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

        {/* Display file details if they exist */}
        {fileDetails && (
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1}}>
                Valid File Hash
              </Typography>
              <VerifiedUserIcon />
            </Box>
            <Typography variant="subtitle2"><strong>Hash:</strong> {searchedHash}</Typography>
            <Typography variant="subtitle2"><strong>Name:</strong> {fileDetails.name}</Typography>
            <Typography variant="subtitle2"><strong>Type:</strong> {fileDetails.type}</Typography>
            <Typography variant="subtitle2"><strong>Size:</strong> {fileDetails.size}</Typography>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {providers.map((provider) => (
              <Grid item xs={12} sm={6} key={provider.walletID}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                    <Typography variant="body2">WalletID: {provider.walletID}</Typography>
                    <Typography variant="body2">Price: {provider.price}</Typography>
                    </Box>
                    <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => handleDownloadClick()}
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