import React, { useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { FormData } from "../interfaces/File";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface downloadHistoryTableProps {
  setSnackbarOpen: (open: boolean) => void;
  setSnackbarMessage: (message: string) => void;
  handleCopy: (text: string) => void;
}

const DownloadHistoryTable: React.FC<downloadHistoryTableProps> = ({ setSnackbarOpen, setSnackbarMessage, handleCopy }) => {
  const [downloads, setDownloads] = React.useState<FormData[]>([]);
  useEffect(() => {
    fetchDownloadData();
  }, [])
  
  const fetchDownloadData = async () => {
    try {
      const response = await fetch("http://localhost:9378/getDownloadHistory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 404) {
        setSnackbarMessage("No download history found");
        setSnackbarOpen(true);
      } else {
        const data = await response.json();
        setDownloads(data);
      }
    } catch (err) {
      console.error("Error fetching download data: ", err);
      setSnackbarMessage("Error fetching download data");
      setSnackbarOpen(true);
    }
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table sx={{ minWidth: 500 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>File Name</TableCell>
            <TableCell>Size (KB)</TableCell>
            <TableCell>Cost (OTTC)</TableCell>
            <TableCell>
              File Hash
              <Tooltip title="Click hash to copy to your clipboard" arrow>
                <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1}} />
              </Tooltip>
            </TableCell>
            <TableCell>
              Uploader Wallet ID
              <Tooltip title="Click wallet ID to copy to your clipboard" arrow>
                <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1}} />
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {downloads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                You have not downloaded any files yet.
              </TableCell>
            </TableRow>
          ) : 
          downloads.map((download) => (
            <TableRow
              key={download.timestamp}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {download.timestamp}
              </TableCell>
              <TableCell>{download.fileName}</TableCell>
              <TableCell>{download.fileSize}</TableCell>
              <TableCell>{download.price}</TableCell>
              <TableCell
                onClick={() => {
                  handleCopy(download.fileHash);
                }}
                sx={{ cursor: "pointer",
                  maxWidth: "200px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                 }}
              >
                <Tooltip title="Click to copy" arrow>
                  <span>{download.fileHash}</span>
                </Tooltip>
              </TableCell>
              <TableCell
                onClick={() => {
                  handleCopy(download.srcID);
                }}
                sx={{ 
                  cursor: "pointer",
                  maxWidth: "200px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <Tooltip title="Click to copy" arrow>
                  <span>{download.srcID}</span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DownloadHistoryTable;