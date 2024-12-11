import { Box, Tooltip } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography, Card, Grid, CardContent, CardActions, Modal, Alert } from "@mui/material";
import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Snackbar } from "@mui/material";
import { set } from "react-hook-form";
import { AuthContext } from "../contexts/AuthContext";
import React from "react";
import { Wallet } from "@mui/icons-material";

interface FormData {
  walletID: string,
  srcID: string,
  price: number,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string,
  timestamp: string,
  fileHash: string,
  bundleMode: boolean
}

const Download = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
  const [downloadLocation, setDownloadLocation] = useState<string>("");
  const [fileHash, setFileHash] = useState("");
  const [searchedHash, setSearchedHash] = useState("");
  const [providers, setProviders] = useState<{walletID: string; price: number;}[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number>();
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [isValidHash, setIsValidHash] = useState<boolean | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  const { publicKey, walletName } = React.useContext(AuthContext);

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  }

  const handleSearchClick = async () => {
    if (!fileHash.trim()) {
      setIsValidHash(false);
      setProviders([]);
      return;
    }

    // send HTTP GET request to backend to get providers and their set prices
    setIsLoading(true);

    const response = await fetch(`http://localhost:9378/getPrices/${fileHash}`);
    if (!response.ok) {
      setIsValidHash(false);
      setProviders([]);
      return;
    }

    const data = await response.json();

    // check if no providers available (i.e, data is an empty object)
    // TODO: Create an error message for this case and display it to the user
    if (Object.keys(data).length === 0) {
      setIsValidHash(false);
      setProviders([]);
      setIsLoading(false);
      return;
    }
    
    // data is a map of walletID to price, loop through the map and create an array of objects to set as providers
    const providerList = Object.entries(data).map(([walletID, price]) => ({walletID, price: Number(price)})); // potential casting error here
    setProviders(providerList);
    setSearchedHash(fileHash);
    setIsValidHash(true);
    setIsLoading(false);

    // Get the list of providers, only the walletID is needed
    const providerListWalletID = providerList.map(provider => provider.walletID);
    const requestBody = {list: providerListWalletID};

    // send a POST request to the backend to cache the list of providers
    try {

      const response = await fetch("http://localhost:9378/putPeersInCache", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("Error caching providers");
      }
    } catch (err: any) {
      console.error("Error caching providers: ", err);
    }
  }

  const handleDownloadClick = async (phash: string) => {
    try {

      const postData = {
        WalletID : publicKey,
        ProviderID : phash,
        DownloadPath : downloadLocation,
        FileHash : searchedHash
      }
      
      console.log("WalletID: ", phash);
      const provider = providers.find((provider) => provider.walletID === phash);
      const price = provider?.price;
      const resp = await fetch(`http://localhost:9378/getbalance/${walletName}`);
      const balancejson = await resp.json();
      const balance = balancejson["balance"];
      if (price === undefined || balance < price) {
        setSnackbarMessage("Insufficient balance");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      const response = await fetch("http://localhost:9378/download", {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        throw new Error("Error downloading file");
      }
      const responseData = await response.json();
      const destWalletAddr = responseData.walletAddress;
      console.log("Provider: ", provider);
      if (!provider) {
        throw new Error("Provider not found");
      }

      const response2 = await fetch(`http://localhost:9378/transferCoins/${walletName}/${destWalletAddr}/${price}/File`, {
        method: 'POST',
      });

      if (!response2.ok) {
        throw new Error("Error transferring coins");
      }

      setDownloadModalOpen(false);
      setDownloadLocation("");

      if (response.ok) {
        setSnackbarMessage("Download successful and coins sent to provider!");
        setSnackbarSeverity("success");
      } else {
        const error = await response.json();
        setSnackbarMessage(error.message || "An error occurred during download");
        setSnackbarSeverity("error");
      }

      setSnackbarOpen(true);

    } catch (err: any) {
      console.error("An error occurred during download:", err);
      setSnackbarMessage("An error occurred during download");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setDownloadModalOpen(false);
      setDownloadLocation("");
    }
  };

  const handleDownload = (walletid: string, price: number) => {
    setSelectedWallet(walletid);
    setSelectedPrice(price);
    console.log("Selected Wallet: ", walletid);
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

        {isValidHash === false && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Invalid file hash. Please enter a valid hash.
          </Alert>
        )}

        {isValidHash && (
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1}}>
                Valid File Hash
              </Typography>
              <VerifiedUserIcon />
            </Box>
          </Box>
        )}

        {isValidHash && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {providers.map((provider) => (
                <Grid item xs={12} sm={6} key={provider.walletID}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between">
                        <Box display="flex" flexDirection="column" alignItems="flex-start" >
                          <Tooltip title={provider.walletID} arrow>
                          <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>WalletID: {provider.walletID}</Typography>
                          </Tooltip>
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
        )}
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
            {(
              <>
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
              onClick={() => handleDownloadClick(selectedWallet)}
              variant="contained"
              color="primary"
              disabled={!downloadLocation}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Download;