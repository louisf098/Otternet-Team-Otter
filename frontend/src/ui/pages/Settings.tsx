import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Settings = () => {
  const navigate = useNavigate();

  const { publicKey, setPublicKey } = useContext(AuthContext);

  const handleSignOut = () => {
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
