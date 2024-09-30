import React from "react";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Outlet />
    </Box>
  );
};

export default MainLayout;
