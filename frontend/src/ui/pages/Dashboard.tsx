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
import { Tabs, Tab } from "@mui/material";

interface DashboardProps {}
const Dashboard: React.FC<DashboardProps> = () => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [selectedFilter, setSelectedFilter] = React.useState(1);
  const [selectedStats, setSelectedStats] = React.useState(1);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  const handleFilterChange = (event: SelectChangeEvent<number>) => {
    setSelectedFilter(event.target.value as number);
  }
  const handleStatsChange = (event: SelectChangeEvent<number>) => {
    setSelectedStats(event.target.value as number);
  }

  return (
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
            <MenuItem value={1}>Node Downloaded Files</MenuItem>
            <MenuItem value={2}>Peer Downloaded Files</MenuItem>
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
        sx={{ margin: -2 }}
      >
        <Tab label="Download History" id="dashboard-tab-history"/>
        <Tab label="Upload History" id="dashboard-tab-upload"/>
        <Tab label="Proxy History" id="dashboard-tab-proxy"/>
      </Tabs>

      <TabSelector value={selectedTab} index={0}>
        <Typography variant="h6" component="div">
          Download History
        </Typography>
        <TransactionHistoryTable />
      </TabSelector>
      <TabSelector value={selectedTab} index={1}>
        <Typography variant="h6" component="div">
          Upload History
        </Typography>
        <UploadHistoryTable />
      </TabSelector>
      <TabSelector value={selectedTab} index={2}>
        <Typography variant="h6" component="div">
          Proxy History
        </Typography>
        <ProxyHistoryTable />
      </TabSelector>
    </Box>
  );
};

export default Dashboard;

