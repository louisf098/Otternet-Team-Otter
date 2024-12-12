import React, { useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { ProxyData } from "../interfaces/File";
import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AuthContext } from "../contexts/AuthContext";

interface proxyHistoryTableProps {
    setSnackbarOpen: (open: boolean) => void;
    setSnackbarMessage: (message: string) => void;
    handleCopy: (text: string) => void;
}

const ProxyHistoryTable: React.FC<proxyHistoryTableProps> = ({ setSnackbarOpen, setSnackbarMessage, handleCopy }) => {
  const [proxies, setProxies] = React.useState<ProxyData[]>([]);
  const { publicKey } = React.useContext(AuthContext);

  useEffect(() => {
    fetchProxyData();
  }, [])

  const fetchProxyData = async () => {
    try {
      const response = await fetch(`http://localhost:9378/getProxyHistory/${publicKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 404) {
        setSnackbarMessage("No proxy history found");
        setSnackbarOpen(true);
        return;
      }
      const data = await response.json();
      setProxies(data);
    } catch (err) {
      console.error("Error fetching proxy data: ", err);
      setSnackbarMessage("Error fetching proxy data");
      setSnackbarOpen(true);
    }
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 370, overflowY: "scroll" }}>
      <Table stickyHeader sx={{ minWidth: 500 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Proxy IP Address</TableCell>
            <TableCell>Rate (OTTC/KB)</TableCell>
            <TableCell>
              Proxy Wallet ID
              <Tooltip title="Click Wallet ID to copy to your clipboard" arrow>
                <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1}}/>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proxies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                You have not used any proxies yet.
              </TableCell>
            </TableRow>
          ) : 
          
          proxies.map((proxy) => (
            <TableRow
              key={proxy.timestamp}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {proxy.timestamp}
              </TableCell>
              <TableCell>{proxy.ipAddr}</TableCell>
              <TableCell>{proxy.price}</TableCell>
              <TableCell
                onClick={() => handleCopy(proxy.srcID)}
                sx={{
                  maxWidth: "200px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  cursor: "pointer",
                }}
              >
                <Tooltip title="Click to copy" arrow>
                  <span>{proxy.srcID}</span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProxyHistoryTable;
