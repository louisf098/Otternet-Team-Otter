import { useContext, useState } from "react";
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

  const [rateError, setRateError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);

  const handleProxyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProxyEnabled(event.target.checked);
    console.log(`proxy: ${proxyEnabled}`);
  };

  const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if ((!isNaN(Number(value)) && Number(value) > 0) || value === "") {
      setRate(value); // Store as string, don't convert to number immediately
      setRateError(null);
    } else {
      setRateError("Rate must be a valid number.");
    }
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!isNaN(Number(value)) || value === "") {
      setPort(value); // Store as string, don't convert to number immediately
      setPortError(null);
    } else {
      setPortError("Invalid port.");
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
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "start",
        paddingBottom: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
          marginBottom: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Typography variant="body1" sx={{ marginRight: 1 }}>
            Enable Your Proxy
          </Typography>
          <Switch
            checked={proxyEnabled}
            onChange={handleProxyChange}
            name="proxyEnabled"
            disabled={Boolean(rateError) || rate === ""}
          />
          <Tooltip
            title="Enable this option to allow others to use your node as a proxy. Set the rate for how others will connect through your node below."
            arrow
          >
            <IconButton>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexGrow: 1,
            flexBasis: "50%",
          }}
        >
          <Typography>
            Your Proxy Service Time:{" "}
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {getElapsedTimeString(elapsedTime)}
            </span>
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 2,
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body1" sx={{ marginRight: 1 }}>
            Rate:
          </Typography>
          <TextField
            variant="outlined"
            type="text"
            value={rate}
            onChange={handleRateChange}
            name="proxy-rate"
            placeholder="1234"
            size="small"
            sx={{ width: "130px" }}
            error={Boolean(rateError)}
            helperText={rateError}
            disabled={proxyEnabled}
          />
          <Typography variant="body2" sx={{ marginLeft: 1, marginRight: 6 }}>
            OTTC/KB
          </Typography>

          {/* <Typography variant="body1" sx={{ marginRight: 1 }}>
            Port:
          </Typography>
          <TextField
            variant="outlined"
            type="text"
            value={port}
            onChange={handlePortChange}
            name="proxy-port"
            placeholder="1234"
            size="small"
            sx={{ width: "130px" }}
            error={Boolean(portError)}
            helperText={portError}
          /> */}
        </Box>
        <Typography>
          Nodes connected to Your Proxy:{" "}
          <span style={{ fontWeight: "bold", color: "blue" }}>0 </span>
        </Typography>
      </Box>
    </Box>
  );
};

export default ProxyPref;
