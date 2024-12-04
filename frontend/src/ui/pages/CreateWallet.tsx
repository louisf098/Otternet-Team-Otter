import { useContext, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import logo from "../public/assets/icons/logo-no-background.svg";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import { createWalletAndGenerateAddress } from "../apis/bitcoin-core";

const CreateWallet = () => {
  const navigate = useNavigate();
  const [walletName, setWalletName] = React.useState("");
  const [walletAddress, setWalletAddress] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");
  const [openCopyNotif, setOpenCopyNotif] = React.useState(false);

  // const [error, setError] = React.useState(false);
  // const [errorMessage, setErrorMessage] = React.useState("");

  const { walletKeyPair, setWalletKeyPair, setPublicKey } =
    useContext(AuthContext);

  const handleCopy = (text: string) => {
    setOpenCopyNotif(true);
    navigator.clipboard.writeText(text);
  };

  const handleGenerateWallet = async () => {
    let res = await createWalletAndGenerateAddress(walletName, passphrase);
    setWalletAddress(res.address);
    setPassphrase(passphrase);
    setWalletKeyPair({ ...walletKeyPair, [walletName]: res.address });
  };

  const handleBackupDownload = () => {
    // Create a Blob object containing the private key text
    const blob = new Blob(
      [
        "Wallet Name: " +
          walletName +
          "\n" +
          "Wallet Address: " +
          walletAddress +
          "\n" +
          "Passphrase: " +
          passphrase,
      ],
      {
        type: "text/plain",
      }
    );

    // Create a URL for the blob object
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor (<a>) element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallet_backup.txt"; // Set the file name

    // Append the anchor to the document, trigger a click, then remove it
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release the URL object
    window.URL.revokeObjectURL(url);
  };

  const handleSignIn = () => {
    navigate("/dashboard", { replace: true });
    setPublicKey(walletAddress);
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        mx: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ m: 2, display: "flex" }}>
        <img src={logo} width={100} height={100} alt="OrcaNet Logo" />
        <Typography
          variant="h2"
          component="a"
          sx={{
            ml: 2,
            mt: 1,
            display: { xs: "none", md: "flex" },
            justifyContent: "right",
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: ".3rem",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          tterNet
        </Typography>
      </Box>
      <Card
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignSelf: "center",
          width: "400px",
          padding: 4,
          gap: 2,
          margin: "auto",
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Create Wallet
        </Typography>
        <Box
          component="form"
          onSubmit={handleSignIn}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2,
          }}
        >
          {walletAddress ? (
            <>
              <FormControl>
                <FormLabel>Wallet ID</FormLabel>
                <OutlinedInput
                  id="walletName"
                  type="text"
                  name="walletName"
                  fullWidth
                  disabled
                  value={walletName}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleCopy(walletName)}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Wallet Address</FormLabel>
                <OutlinedInput
                  id="walletAddress"
                  type="text"
                  name="walletAddress"
                  fullWidth
                  disabled
                  value={walletAddress}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleCopy(walletAddress)}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Passphrase</FormLabel>
                <OutlinedInput
                  id="passphrase"
                  type="text"
                  name="passphrase"
                  fullWidth
                  disabled
                  value={passphrase}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleCopy(passphrase)}
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <Button
                onClick={handleBackupDownload}
                color="primary"
                startIcon={<DownloadIcon />}
              >
                Download Backup File
              </Button>
              <Button type="submit" fullWidth variant="contained">
                Sign In
              </Button>
              <Snackbar
                message="Copied to clipboard"
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={2000}
                onClose={() => setOpenCopyNotif(false)}
                open={openCopyNotif}
              />
            </>
          ) : (
            <>
              <FormControl>
                <FormLabel>Wallet Name</FormLabel>
                <OutlinedInput
                  id="walletName"
                  type="text"
                  name="walletName"
                  fullWidth
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Passphrase</FormLabel>
                <OutlinedInput
                  id="passphrase"
                  type="text"
                  name="passphrase"
                  fullWidth
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateWallet}
              >
                Generate Wallet
              </Button>
            </>
          )}
          {/* <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="privateKey">Private Key</FormLabel>
            </Box>
            <TextField
              name="privateKey"
              placeholder="••••••"
              type="privateKey"
              id="privateKey"
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="confirmPrivateKey">
                Confirm Private Key
              </FormLabel>
            </Box>
            <TextField
              error={error}
              helperText={errorMessage}
              name="confirmPrivateKey"
              placeholder="••••••"
              type="confirmPrivateKey"
              id="confirmPrivateKey"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={error ? "error" : "primary"}
            />
          </FormControl> */}
          <Typography sx={{ textAlign: "center" }}>
            Already have a wallet?{" "}
            <span>
              <Link
                onClick={() => navigate("/", { replace: true })}
                variant="body2"
                sx={{ alignSelf: "center", cursor: "pointer" }}
              >
                Sign In
              </Link>
            </span>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default CreateWallet;
