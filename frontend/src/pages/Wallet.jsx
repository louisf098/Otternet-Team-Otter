import React from "react";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Sidebar from "../components/Sidebar";

const Wallet = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box>
        <Grid container spacing={2}>
          <Grid size={3}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Wallet</Typography>
              <Typography variant="body1">
                qsfjlkwjf923urjfwoijfjefipjwfiu2fjiwejfjwfwf3rfw238238723f
              </Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Balance (OTTC)</Typography>
              <Typography variant="body1">555 Ottercoins</Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Revenue</Typography>
              <Typography variant="body1">Mining: 555 OtterCoins</Typography>
              <Typography variant="body1">Peers: 555 OtterCoins</Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Spendings</Typography>
              <Typography variant="body1">555 OtterCoins</Typography>
            </Paper>
          </Grid>
          <Grid size={6}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Transactions</Typography>
            </Paper>
          </Grid>
          <Grid size={6}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="h5">Miner</Typography>
              <Typography variant="body1">555 OtterCoins</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Wallet;
