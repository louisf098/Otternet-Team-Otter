import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { backupWallet, lockWallet } from "../apis/bitcoin-core";
import path from "path-browserify";

interface settingstProps {
  setSnackbarOpen: (open: boolean) => void;
  setSnackbarMessage: (message: string) => void;
}

const Settings: React.FC<settingstProps> = ({
  setSnackbarOpen,
  setSnackbarMessage,
}) => {
  const navigate = useNavigate();

  const { publicKey, setPublicKey, walletName } = useContext(AuthContext);

  const [backupPath, setBackupPath] = useState("");

  const handleSignOut = async () => {
    let status = await lockWallet(publicKey);
    if (status !== "locked") {
      return;
    }
    const response = await fetch("http://localhost:9378/stopDHT", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    navigate("/", { replace: true });
    setPublicKey("");
  };

  const handleBackupWallet = async () => {
    const backupFilePath = encodeURIComponent(
      path.join(backupPath, "wallet.dat")
    );
    let status = await backupWallet(walletName, backupFilePath);
    if (status == "wallet backup successful") {
      setSnackbarMessage("Wallet backup successful");
    } else {
      setSnackbarMessage(status);
    }
    setSnackbarOpen(true);
  };

  const selectFolder = async () => {
    const path = await window.electronAPI.selectDownloadPath();
    if (path) {
      setBackupPath(path);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        m: 1,
      }}
    >
      <Typography variant="h3" sx={{ mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Wallet Address: {publicKey}
      </Typography>
      <Button onClick={handleSignOut}>Sign Out</Button>
      <Button onClick={selectFolder}>Select Backup Folder</Button>
      {backupPath && <p>Selected Folder: {backupPath}</p>}
      <Button onClick={handleBackupWallet} disabled={!backupPath}>
        Backup Wallet
      </Button>
    </Box>
  );
};

export default Settings;
