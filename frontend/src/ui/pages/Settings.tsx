import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Settings = () => {
  const navigate = useNavigate();

  const { setPublicKey } = useContext(AuthContext);

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
      <Button onClick={handleSignOut}>Logout</Button>
    </Box>
  );
};

export default Settings;
