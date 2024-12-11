import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { backupWallet, lockWallet } from "../apis/bitcoin-core";

const Settings = () => {
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
    console.log(walletName, encodeURIComponent(backupPath));
    await backupWallet(
      walletName,
      encodeURIComponent(backupPath) + "%5Cwalletbackup"
    );
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
        Wallet ID: {publicKey}
      </Typography>
      <Button onClick={handleSignOut}>Sign Out</Button>
      <Button onClick={selectFolder}>Select Backup Folder</Button>
      {backupPath && <p>Selected Folder: {backupPath}</p>}
      <Button onClick={handleBackupWallet}>Backup Wallet</Button>
    </Box>
  );
};

export default Settings;
