import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import UploadHistoryTable from "../components/UploadHistoryTable";
import TransactionHistoryTable from "../components/TransactionHistoryTable";

interface DashboardProps {}
const Dashboard: React.FC<DashboardProps> = () => {
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
          widht: "100%",
        }}
      >
        <Box sx={{ display: "flex", width: "250px" }}>
          <Typography variant="body1" sx={{ mt: 1, mr: 1 }}>
            Filter
          </Typography>
          <Select fullWidth size="small" value={1}>
            <MenuItem value={1}>Node Downloaded Files</MenuItem>
            <MenuItem value={2}>Peer Downloaded Files</MenuItem>
            <MenuItem value={3}>Thirty</MenuItem>
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
            <Select fullWidth size="small" variant="standard" value={1}>
              <MenuItem value={1}>Past 24 Hours</MenuItem>
              <MenuItem value={2}></MenuItem>
              <MenuItem value={3}></MenuItem>
            </Select>
          </Box>
          <Box sx={{ display: "flex" }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Recent Revenue: {99} OTTC
            </Typography>
          </Box>
          <Box sx={{ display: "flex" }}>
            <Typography variant="body1">
              Bytes Uploaded: {1000} bytes
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" component="div">
          Transaction History
        </Typography>
        <TransactionHistoryTable />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" component="div">
          Upload History
        </Typography>
        <UploadHistoryTable />
      </Box>
    </Box>
  );
};

export default Dashboard;
