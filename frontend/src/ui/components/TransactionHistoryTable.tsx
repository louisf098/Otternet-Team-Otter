import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

interface DashboardData {
  time: Date;
  name: string;
  size: number;
  peerCount: number;
  uploaderID: string;
  downloaderID: string;
  downloaderNode: string;
  proxyNode: string;
}

function createData(
  time: Date,
  name: string,
  size: number,
  peerCount: number,
  uploaderID: string,
  downloaderID: string,
  downloaderNode: string,
  proxyNode: string
): DashboardData {
  return {
    time,
    name,
    size,
    peerCount,
    uploaderID,
    downloaderID,
    downloaderNode,
    proxyNode,
  };
}

const rows = [
  createData(
    new Date(),
    "hw1.zip",
    10000000,
    13,
    "jwnihfhifvhwi",
    "98fhu39fh239fu",
    "db1ygf7b2iv3",
    "8ybfy7b1t79f7v38"
  ),
  createData(
    new Date(),
    "screenshot.png",
    10000,
    12321,
    "f2u9h73fh3",
    "f8hb3yfh9u2hf",
    "fhy3714b9yfv1bv",
    "nvy8hby1rhv7"
  ),
  createData(
    new Date(),
    "essay1.pdf",
    321323,
    123213,
    "rf8uh48yf8yu",
    "fn9uc892d3d",
    "fm10h78uhgf8hno",
    "9fuyb17gb78fvcb2o"
  ),
];

const TransactionHistoryTable = () => {
  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table sx={{ minWidth: 500 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>File Name</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell>Uploader ID</TableCell>
            <TableCell>Downloader Node</TableCell>
            <TableCell>Proxy Node</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.name}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.time.toISOString()}
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.size}</TableCell>
              <TableCell>{row.peerCount}</TableCell>
              <TableCell>{row.uploaderID}</TableCell>
              <TableCell>{row.downloaderNode}</TableCell>
              <TableCell>{row.proxyNode}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionHistoryTable;
