import React, { useState } from "react";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";

// function createData(transactionID, dateTime, cost, status) {
//   return { transactionID, dateTime, cost, status };
// }
interface TransactionData {
  transactionID: string,
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

const rows: TransactionData[] = [
  createData("1d123er131fd1f", 10000000, 13),
  createData("d1211df131df1", 10000, 12321),
  createData("1d12d1221d11d", 321323, 123213),
];

interface WalletProps{}
const Wallet: React.FC<WalletProps> = () => {
  const [mining, toggleMining] = useState(false);
  return (
    <Grid container spacing={1} sx={{ m: 1, p: 1 }}>
      <Grid size={12}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Wallet
        </Typography>
      </Grid>
      <Grid size={3}>
        <Paper sx={{ p: 1, flexGrow: 1, height: "100px" }}>
          <Typography variant="h5">Wallet ID:</Typography>
          <Typography variant="body1" sx={{ wordWrap: "break-word" }}>
            qsfjlkwjf923urjfwoijfjefipjwfiu2fjiwejfjwfwf3rfw238238723f
          </Typography>
        </Paper>
      </Grid>
      <Grid size={3}>
        <Paper sx={{ p: 1, flexGrow: 1, height: "100px" }}>
          <Typography variant="h5">Balance (OTTC)</Typography>
          <Typography variant="body1">555 Ottercoins</Typography>
        </Paper>
      </Grid>

      <Grid size={3}>
        <Paper sx={{ p: 1, flexGrow: 1, height: "100px" }}>
          <Typography variant="h5">Revenue</Typography>
          <Typography variant="body1">Mining: 555 OTC</Typography>
          <Typography variant="body1">Peers: 555 OTC</Typography>
        </Paper>
      </Grid>
      <Grid size={3}>
        <Paper sx={{ p: 1, height: "100px" }}>
          <Typography variant="h5">Spendings</Typography>
          <Typography variant="body1">555 OTC</Typography>
        </Paper>
      </Grid>
      <Grid size={12}>
        <Box
          component={Paper}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
      <Grid size={12}>
        <Paper sx={{ p: 1 }}>
          <Typography variant="h5">Transactions</Typography>
          <TableContainer sx={{ mt: 1 }}>
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
                    key={row.transactionID}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {row.transactionID}
                    </TableCell>
                    <TableCell>{row.dateTime}</TableCell>
                    <TableCell>{row.cost}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Wallet;
