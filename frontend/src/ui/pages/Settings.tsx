import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import React from "react";

const Settings = () => {
  const navigate = useNavigate();
  return (
    <div>
      <Button onClick={() => navigate("/", { replace: true })}>Logout</Button>
    </div>
  );
};

export default Settings;
