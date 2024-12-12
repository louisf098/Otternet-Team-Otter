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
import { getTransactions } from "../apis/bitcoin-core";
import { Transaction } from "../interfaces/Transactions";
interface transactionHistoryTableProps {
  setSnackbarOpen: (open: boolean) => void;
  setSnackbarMessage: (message: string) => void;
  handleCopy: (text: string) => void;
  transactions: Transaction[];
}

const TransactionHistoryTable: React.FC<transactionHistoryTableProps> = ({
  setSnackbarOpen,
  setSnackbarMessage,
  handleCopy,
  transactions,
}) => {
  return (
    <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 370, overflowY: "scroll"  }}>
      <Table stickyHeader sx={{ minWidth: 500 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Amount of Coins</TableCell>
            <TableCell>
              Wallet Address
              <Tooltip title="Click hash to copy to your clipboard" arrow>
                <HelpOutlineIcon sx={{ fontSize: 16, paddingLeft: 1 }} />
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                You have not made any transactions yet.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.txid}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {transaction.timeReceived.toLocaleString()}
                </TableCell>
                <TableCell>{transaction.txid}</TableCell>
                <TableCell
                  style={{
                    color:
                      transaction.status === "Pending"
                        ? "orange"
                        : transaction.status === "Completed"
                        ? "green"
                        : "inherit",
                  }}
                >
                  {transaction.status}
                </TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell
                  onClick={() => {
                    handleCopy(transaction.address);
                  }}
                  sx={{
                    cursor: "pointer",
                    maxWidth: "200px",
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  <Tooltip title="Click to copy" arrow>
                    <span>{transaction.address}</span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionHistoryTable;
