import React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Sidebar from "../components/Sidebar";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function createData(name, size, peerCount) {
  return { name, size, peerCount };
}

const rows = [
  createData("hw1.zip", 10000000, 13),
  createData("screenshot.png", 10000, 12321),
  createData("essay1.pdf", 321323, 123213),
];

const Dashboard = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", p: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="h3" sx={{ fontWeight: 500 }}>
            Activity
          </Typography>
          <Box sx={{ display: "flex" }}>
            <Typography variant="body1" sx={{ mt: 1, mr: 1 }}>
              Filter
            </Typography>
            <Select fullWidth size="small" value={1}>
              <MenuItem value={1}>Uploaded Files</MenuItem>
              <MenuItem value={2}>Twenty</MenuItem>
              <MenuItem value={3}>Thirty</MenuItem>
            </Select>
          </Box>
        </Box>
        <Box
          sx={{ display: "flex", flexDirection: "column", p: 1 }}
          component={Paper}
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
              Recent Revenue: {99} OTC
            </Typography>
          </Box>
          <Box sx={{ display: "flex" }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Bytes Uploaded: {1000} bytes
            </Typography>
          </Box>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table sx={{ minWidth: 500 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Peers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.name}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.size}</TableCell>
                <TableCell>{row.peerCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Dashboard;
