import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";

interface DeviceData {
  id: number;
  name: string;
  status: string;
  load: number;
  rate: number;
}

const devices: DeviceData[] = [
  {
    id: 1,
    name: "RTX 3050",
    status: "Running",
    load: 50,
    rate: 10,
  },
  {
    id: 2,
    name: "GTX 1080 Ti",
    status: "Stopped",
    load: 0,
    rate: 20,
  },
  {
    id: 3,
    name: "Intel i9-10900K",
    status: "Disabled",
    load: 0,
    rate: 0,
  },
];

const MiningDevicesTable = () => {
  return (
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Device</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Load</TableCell>
            <TableCell>Profitability</TableCell>
            <TableCell>
              Enable/Disable All <Switch />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => (
            <TableRow
              key={device.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {device.name}
              </TableCell>
              <TableCell
                sx={{
                  color:
                    device.status == "Running"
                      ? "green"
                      : device.status == "Stopped"
                      ? "Red"
                      : "Grey",
                }}
              >
                {device.status}
              </TableCell>
              <TableCell>{device.load}%</TableCell>
              <TableCell>{device.rate} OTC/24hr</TableCell>
              <TableCell>
                <Switch checked={device.status != "Disabled"} />
                <IconButton disabled={device.status == "Disabled"}>
                  <PlayCircleFilledRoundedIcon />
                </IconButton>
                <IconButton disabled={device.status == "Disabled"}>
                  <StopCircleRoundedIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MiningDevicesTable;
