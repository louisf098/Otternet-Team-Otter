import React, { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { FormData } from "../interfaces/File";
import { Snackbar, Tooltip } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// interface DashboardData {
//   time: Date;
//   name: string;
//   size: number;
//   cost: number;
//   peerCount: number;
//   nodeLocations: string[];
// }
// function createData(
//   time: Date,
//   name: string,
//   size: number,
//   cost: number,
//   peerCount: number,
//   nodeLocations: string[]
// ): DashboardData {
//   return { time, name, size, cost, peerCount, nodeLocations };
// }

// const rows = [
//   createData(new Date(), "hw1.zip", 10000000, 1, 13, ["213f3ewf22", "9f3h8yv38yfb8y"]),
//   createData(new Date(), "screenshot.png", 10000, 2, 12321, ["4gft43fgf8d37f"]),
//   createData(new Date(), "essay1.pdf", 321323, 3, 123213, ["bd82gf7tg376g7"]),
// ];

interface UploadHistoryTableProps {
  setSnackbarOpen: (open: boolean) => void;
  setSnackbarMessage: (message: string) => void;
}

const UploadHistoryTable: React.FC<UploadHistoryTableProps> = ({ setSnackbarOpen, setSnackbarMessage }) => {
  const [uploads, setUploads] = useState<FormData[]>([]);

  useEffect(() => {
    const fetchUploads = async () => {
      // fetch all uploads
      const response = await fetch("http://localhost:9378/getUploads", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setUploads(data);
    };
    fetchUploads();
  }, []);
  
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
      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 1,
          maxHeight: 440,
        }}
      >
        <Table 
          sx={{ minWidth: 500 }} 
          aria-label="simple table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Size (KB)</TableCell>
              <TableCell>Cost (OTTC)</TableCell>
              <TableCell>Bundle Mode</TableCell>
              <TableCell>
                File Hash
                <Tooltip title="Click hash to copy" arrow>
                  <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1 } } />
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {rows.map((row) => (
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
            ))} */}
            {uploads.map((upload) => (
              <TableRow
                key={upload.fileName}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {upload.timestamp}
                </TableCell>
                <TableCell>{upload.fileName}</TableCell>
                <TableCell>{upload.fileSize / 1000}</TableCell>
                <TableCell>{upload.price}</TableCell>
                <TableCell>{upload.bundleMode ? "Yes" : "No"}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 200,
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    cursor: "pointer",
                  }}
                  onClick={() => handleCopy(upload.fileHash)}  
                >
                  <Tooltip title="Click to copy" arrow>
                    <span>{upload.fileHash}</span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default UploadHistoryTable;
