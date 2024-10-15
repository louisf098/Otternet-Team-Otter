import { useState } from "react";
import {
  Box,
  Switch,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ProxyPref = () => {
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [rate, setRate] = useState<number | string>("");
  const [port, setPort] = useState<number | string>("");

  const handleProxyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProxyEnabled(event.target.checked);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setRate(value === "" ? "" : Number(value));
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPort(value === "" ? "" : Number(value));
  };

  return (
    <Box
      sx={{
        display: "block",
        justifyContent: "space-between",
        alignItems: "center",
        height: "10vh",
        padding: 2,
        borderBottom: "1px solid #ccc", // Optional divider for the top half to remove later
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ marginRight: 1 }}>
            Enable Proxy
          </Typography>
          <Tooltip
            title="Enable this option to allow others to use your node as a proxy. Set the rate and port for how others will connect through your node below."
            arrow
          >
            <IconButton>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Switch
            checked={proxyEnabled}
            onChange={handleProxyChange}
            name="proxyEnabled"
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
        <Typography variant="body1" sx={{ marginRight: 1 }}>
          Rate:
        </Typography>
        <TextField
          variant="outlined"
          type="number"
          value={rate}
          onChange={handleRateChange}
          name="proxy-rate"
        />
        <Typography variant="body1" sx={{ marginRight: 1 }}>
          Port:
        </Typography>
        <TextField
          variant="outlined"
          type="number"
          value={port}
          onChange={handlePortChange}
          name="proxy-port"
        />
      </Box>
    </Box>
  );
};

export default ProxyPref;
