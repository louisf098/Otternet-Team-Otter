import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import UploadHistoryTable from "../components/UploadHistoryTable";
import TransactionHistoryTable from "../components/TransactionHistoryTable";
import ProxyHistoryTable from "../components/ProxyHistoryTable";
import TabSelector from "../components/TabSelector";
import { Tabs, Tab, SnackbarCloseReason } from "@mui/material";
import { Snackbar } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Tooltip from "@mui/material/Tooltip";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface TransactionData {
  transactionID: string;
  dateTime: number;
  cost: number;
  status?: String;
}

function createData(
  transactionID: string,
  dateTime: number,
  cost: number,
  status?: string
): TransactionData {
  return { transactionID, dateTime, cost, status };
}

interface DashboardProps {}
const Dashboard: React.FC<DashboardProps> = () => {
  const [selectedTableTab, setSelectedTableTab] = React.useState(0);
  const [selectedInfoTab, setSelectedInfoTab] = React.useState(0);
  const [selectedFilter, setSelectedFilter] = React.useState(1);
  const [selectedStats, setSelectedStats] = React.useState(1);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTableTab(newValue);
  };
  const handleFilterChange = (event: SelectChangeEvent<number>) => {
    setSelectedFilter(event.target.value as number);
  };
  const handleStatsChange = (event: SelectChangeEvent<number>) => {
    setSelectedStats(event.target.value as number);
  };

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  const handleSnackbarClose = (
    event: React.SyntheticEvent<any, Event> | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbarMessage("Text copied to clipboard");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error copying text: ", err);
      setSnackbarMessage("Error copying text");
      setSnackbarOpen(true);
    }
  };

  const [mining, toggleMining] = React.useState(false);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          width: "100%",
          m: 1,
          p: 1,
        }}
      >
        <Typography variant="h3" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Box sx={{ display: "flex" }}>
          <Paper sx={{ p: 1, height: "140px", mr: 2 }}>
            <Typography variant="h5">Wallet</Typography>
            <Typography variant="body1" sx={{ wordWrap: "break-word" }}>
              Wallet ID: qsfjlkwjf923urjfwoijfjefipjwf
              <Typography variant="body1">Balance: 555 OTC</Typography>
              <Typography variant="body1">Mining Revenue: 555 OTC</Typography>
              <Typography variant="body1">Proxy Revenue: 555 OTC</Typography>
            </Typography>
          </Paper>
          <Grid size={2.4}>
            <Box
              component={Paper}
              sx={{
                display: "flex",
                flexDirection: "column",
                p: 1,
              }}
            >
              <Typography variant="h5">Miner</Typography>
              <Typography variant="body1">Time Elapsed: 3h 24m 19s</Typography>
              <Typography variant="body1">Coins Mined: 219.58 OTTC</Typography>
              <Typography variant="body1">Mining Rate: 64.5 OTTC/h</Typography>
              <Button variant="contained" onClick={() => toggleMining(!mining)}>
                {mining ? "Pause Mining" : "Start Mining"}
              </Button>
            </Box>
          </Grid>
        </Box>

        <Box
          component={Paper}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 1,
            width: "100%",
          }}
        >
          {/* <Box sx={{ display: "flex", width: "250px" }}>
            <Typography variant="body1" sx={{ mt: 1, mr: 1 }}>
              Filter
            </Typography>
            <Select fullWidth size="small" value={selectedFilter} onChange={handleFilterChange}>
              <MenuItem value={1}>Date (Latest)</MenuItem>
              <MenuItem value={2}>Date (Earliest)</MenuItem>
              <MenuItem value={3}>Name (A-Z)</MenuItem>
              <MenuItem value={4}>Name (Z-A)</MenuItem>
              <MenuItem value={5}>Size (Largest)</MenuItem>
              <MenuItem value={6}>Size (Smallest)</MenuItem>
              <MenuItem value={7}>Cost (Highest)</MenuItem>
              <MenuItem value={8}>Cost (Lowest)</MenuItem>
              <MenuItem value={9}>Bundle Mode (On)</MenuItem>
              <MenuItem value={10}>Bundle Mode (Off)</MenuItem>
            </Select>
          </Box> */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 1,
              width: "650px",
            }}
          >
            <Box sx={{ display: "flex" }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Statistics
              </Typography>
              <Select
                fullWidth
                size="small"
                variant="standard"
                value={selectedStats}
                onChange={handleStatsChange}
              >
                <MenuItem value={1}>Past 24 Hours</MenuItem>
                <MenuItem value={2}>Past Week</MenuItem>
                <MenuItem value={3}>Past Month</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: "flex" }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Recent Revenue: {Math.floor(Math.random() * 256)} OTTC
              </Typography>
            </Box>
            <Box sx={{ display: "flex" }}>
              <Typography variant="body1">
                Bytes Uploaded: {Math.floor(Math.random() * 5100)} KB
              </Typography>
            </Box>
          </Box>
        </Box>
        <Tabs
          value={selectedTableTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ margin: -1 }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>Current Uploads</span>
                <Tooltip title="You can also edit a row by right-clicking!">
                  <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1 }} />
                </Tooltip>
              </Box>
            }
            id="dashboard-tab-upload"
          />
          <Tab label="Download History" id="dashboard-tab-history" />
          <Tab label="Proxy History" id="dashboard-tab-proxy" />
        </Tabs>

        <TabSelector value={selectedTableTab} index={0}>
          <UploadHistoryTable
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            handleCopy={handleCopy}
          />
        </TabSelector>
        <TabSelector value={selectedTableTab} index={1}>
          <TransactionHistoryTable
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            handleCopy={handleCopy}
          />
        </TabSelector>
        <TabSelector value={selectedTableTab} index={2}>
          <ProxyHistoryTable
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            handleCopy={handleCopy}
          />
        </TabSelector>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default Dashboard;
