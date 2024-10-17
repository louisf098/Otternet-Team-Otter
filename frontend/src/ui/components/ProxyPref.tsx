import { useContext } from "react";
import {
  Box,
  Switch,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import { ProxyContext } from "../contexts/ProxyContext";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ProxyPref = () => {
  const {
    proxyEnabled,
    setProxyEnabled,
    rate,
    setRate,
    port,
    setPort,
    elapsedTime,
  } = useContext(ProxyContext);

  const handleProxyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProxyEnabled(event.target.checked);
    console.log(`proxy: ${proxyEnabled}`);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // setRate(value === "" ? "" : Number(value));
    if (!isNaN(Number(value)) || value === "") {
      setRate(value); // Store as string, don't convert to number immediately
    }
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // setPort(value === "" ? "" : Number(value));
    if (!isNaN(Number(value)) || value === "") {
      setPort(value); // Store as string, don't convert to number immediately
    }
  };

  const getElapsedTimeString = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Box
      sx={{
        display: "block",
        justifyContent: "space-between",
        alignItems: "center",
        height: "10vh",
        padding: 2,
        // borderBottom: "1px solid #ccc", // Optional divider for the top half to remove later
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          // justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ marginRight: 1 }}>
            Enable Proxy
          </Typography>
          <Switch
            checked={proxyEnabled}
            onChange={handleProxyChange}
            name="proxyEnabled"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "60%",
          }}
        >
          <Tooltip
            title="Enable this option to allow others to use your node as a proxy. Set the rate and port for how others will connect through your node below."
            arrow
          >
            <IconButton>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography>
            Elapsed Time: {getElapsedTimeString(elapsedTime)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
        <Typography variant="body1" sx={{ marginRight: 1 }}>
          Rate:
        </Typography>
        <TextField
          variant="outlined"
          type="text"
          value={rate}
          onChange={handleRateChange}
          name="proxy-rate"
          placeholder="OTTC/KB"
          size="small"
        />
        <Typography variant="body1" sx={{ marginRight: 1 }}>
          Port:
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "50%",
          }}
        >
          <TextField
            variant="outlined"
            type="text"
            value={port}
            onChange={handlePortChange}
            name="proxy-port"
            placeholder="1234"
            size="small"
          />
          <Typography>
            Nodes connected to proxy:{" "}
            <span style={{ fontWeight: "bold" }}>21 </span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProxyPref;
