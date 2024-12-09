import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { lockWallet } from "../apis/bitcoin-core";

const Settings = () => {
  const navigate = useNavigate();

  const { publicKey, setPublicKey } = useContext(AuthContext);

  const handleSignOut = async() => {
    console.log(publicKey)
    let status = await lockWallet(publicKey)
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
    </Box>
  );
};

export default Settings;
