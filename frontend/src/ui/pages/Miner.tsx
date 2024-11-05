import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import StatCard from "../components/StatCard";
import MiningDevicesTable from "../components/MiningDevicesTable";

const Miner = () => {
  return (
    <Box sx={{ m: 4 }}>
      <Typography variant="h3" sx={{ mb: 3, textAlign: "left" }}>
        Miner
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
        <StatCard label="DEVICES RUNNING" value="1/3" />
        <StatCard label="GLOBAL RATE" value="10 OTC/24h" />
        <StatCard label="UNPAID BALANCE" value="14.5 OTC" />
        <StatCard label="WALLET BALANCE" value="41 OTC" />
      </Box>
      <Box sx={{ mb: 1 }}>
        <Button variant="contained" size="small" sx={{ mr: 1 }}>
          Start All
        </Button>
        <Button variant="contained" size="small">
          Stop All
        </Button>
      </Box>
      <MiningDevicesTable />
    </Box>
  );
};

export default Miner;
