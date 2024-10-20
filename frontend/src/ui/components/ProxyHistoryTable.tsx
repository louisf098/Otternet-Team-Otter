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
  cost: number;
  peerCount: number;
  nodeLocations: string[];
}
function createData(
  time: Date,
  name: string,
  size: number,
  cost: number,
  peerCount: number,
  nodeLocations: string[]
): DashboardData {
  return { time, name, size, cost, peerCount, nodeLocations };
}

const rows = [
  createData(new Date(), "hw1.zip", 10000000, 1, 13, ["213f3ewf22", "9f3h8yv38yfb8y"]),
  createData(new Date(), "screenshot.png", 10000, 2, 12321, ["4gft43fgf8d37f"]),
  createData(new Date(), "essay1.pdf", 321323, 3, 123213, ["bd82gf7tg376g7"]),
];

const ProxyHistoryTable = () => {
  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table sx={{ minWidth: 500 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>File Name</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell>Peers</TableCell>
            <TableCell>Node Locations</TableCell>
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
              <TableCell>{row.cost}</TableCell>
              <TableCell>{row.peerCount}</TableCell>
              <TableCell>{row.nodeLocations.join(";")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProxyHistoryTable;
