import { Box } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography, Card, Grid, CardContent, CardActions, Modal } from "@mui/material";
import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface FormData {
  userID: string,
  price: number,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string,
  timestamp: string,
  fileHash: string,
  bundleMode: boolean
}

// dummy data for download demo
const dummyProviders = [
  {walletID: 'e0d123e5f316bef78bfdf5a008837577', price: 12}, 
  {walletID: '95982461e7db28fb0d0ea25bd2fc9d7f', price: 15}, 
  {walletID: '06adac43bac94634b3773f13296cf6d9', price: 19}
];

const dummyFileDetails = {
  name: "Cookie_Monster_Script.txt",
  type: "Text Document(.txt)",
  size: 174
};

const Download = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [downloadLocation, setDownloadLocation] = useState<string>("");
  const [fileHash, setFileHash] = useState("");
  const [searchedHash, setSearchedHash] = useState("");
  const [providers, setProviders] = useState<{walletID: string; price: number;}[]>([]);
  const [fileDetails, setFileDetails] = useState<{name: string; type: string; size: number;} | null >(null);
  const [selectedPrice, setSelectedPrice] = useState<number>();
  const [selectedWallet, setSelectedWallet] = useState<string>("");

  const handleSearchClick = () => {
    setIsLoading(true);

    setTimeout(() => {
      setProviders(dummyProviders);
      setSearchedHash(fileHash);
      setFileDetails(dummyFileDetails);
      setIsLoading(false);
    }, 2000);
  }

  const handleDownloadClick = async (phash: string, pprice: number) => {
    try {
      const postData: FormData = {
        userID: phash, 
        price: pprice,
        fileName: dummyFileDetails.name,
        filePath: downloadLocation,
        fileSize: dummyFileDetails.size,
        fileType: dummyFileDetails.type,
        timestamp: new Date().toISOString(),
        fileHash: searchedHash,
        bundleMode: false
      };
      
      const response = await fetch("http://localhost:9378/download", {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      
      console.log("Response: ", response);
      setDownloadModalOpen(false);
      setDownloadLocation("");

    } catch (err: any) {
      console.error("An error occurred during download:", err);
      setDownloadModalOpen(false);
      setDownloadLocation("");
    }
  };

  const handleDownload = (walletid: string, price: number) => {
    setSelectedWallet(walletid);
    setSelectedPrice(price);
    setDownloadModalOpen(true);
  };

  const handleSelectDownloadLocation = async () => {
    try {
      if (!window.electronAPI || !window.electronAPI.selectDownloadPath) {
        throw new Error("Electron API not available");
      }
      const location = await window.electronAPI.selectDownloadPath();
      if (!location) {
        throw new Error("Problem with selecting download location");
      }
      setDownloadLocation(location);
    } catch (err: any) {
      console.error("Error with selecting download location: ", err);
    }
  };

  const handleDownloadModalClose = () => {
    setDownloadModalOpen(false);
    setDownloadLocation("");
  };

  return (
    <Box sx={{
      width: '100%',             
      maxWidth: '1000px',         
      m: '0 auto',               
      p: 2,                      
      textAlign: 'center', 
    }}>
      <Box sx={{ m: 1, p: 2, width: '100%', maxWidth: '1000px' }}>
        <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
          Download File
        </Typography>
        <TextField
          id="outlined-hash"
          label="Input File Hash Here"
          variant="outlined"
          value={fileHash}
          onChange={(e) => setFileHash(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          type="submit" 
          onClick={handleSearchClick}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Search Providers"}
        </Button>

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
                        <Typography variant="body2">Price: {provider.price} OTTC</Typography>
                      </Box>
                      <CardActions>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => handleDownload(provider.walletID, provider.price)}
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

      <Modal
        open={downloadModalOpen}
        onClose={handleDownloadModalClose}
        aria-labelledby="download-modal-title"
        aria-describedby="download-modal-description"
      >
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography id="download-modal-title" variant="h6" component="h2">
            Confirm Download
          </Typography>
          <Typography id="download-modal-description" sx={{ mt: 2 }}>
            {fileDetails && (
              <>
                <strong>Name:</strong> {fileDetails.name} <br />
                <strong>Size:</strong> {fileDetails.size} KB <br />
                <strong>Type:</strong> {fileDetails.type} <br />
                <strong>Price:</strong> {selectedPrice} OTTC <br />
                <strong>Download Location:</strong> {downloadLocation || "Not Selected"}
              </>
            )}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
            <Button onClick={handleSelectDownloadLocation} sx={{ mr: 2 }}>
              Select Download Location
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={handleDownloadModalClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={() => handleDownloadClick(selectedWallet, selectedPrice!)}
              variant="contained"
              color="primary"
              disabled={!downloadLocation}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Download;