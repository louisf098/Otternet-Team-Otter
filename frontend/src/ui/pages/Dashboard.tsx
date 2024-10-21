import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
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

interface DashboardProps {}
const Dashboard: React.FC<DashboardProps> = () => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [selectedFilter, setSelectedFilter] = React.useState(1);
  const [selectedStats, setSelectedStats] = React.useState(1);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  const handleFilterChange = (event: SelectChangeEvent<number>) => {
    setSelectedFilter(event.target.value as number);
  }
  const handleStatsChange = (event: SelectChangeEvent<number>) => {
    setSelectedStats(event.target.value as number);
  }

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
  }

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
  }

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
        <Box
          component={Paper}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 1,
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", width: "250px" }}>
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
          </Box>
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
              <Select fullWidth size="small" variant="standard" value={selectedStats} onChange={handleStatsChange}>
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
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ margin: -1 }}
        >
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center'}}>
              <span>Current Uploads</span>
              <Tooltip title="You can also edit a row by right-clicking!">
                <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1 }}/>
              </Tooltip>
            </Box>
          } id="dashboard-tab-upload"/>
          <Tab label="Download History" id="dashboard-tab-history"/>
          <Tab label="Proxy History" id="dashboard-tab-proxy"/>
        </Tabs>

        <TabSelector value={selectedTab} index={0}>
          <UploadHistoryTable 
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            handleCopy={handleCopy}
          />
        </TabSelector>
        <TabSelector value={selectedTab} index={1}>
          <TransactionHistoryTable 
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            handleCopy={handleCopy}
          />
        </TabSelector>
        <TabSelector value={selectedTab} index={2}>
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

