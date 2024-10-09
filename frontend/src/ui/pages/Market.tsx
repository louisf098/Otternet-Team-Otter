import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";


interface MarketProps{}
const Market: React.FC<MarketProps> = () => {
  return (
    <Box sx={{ m: 1, p: 1 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Market
      </Typography>
    </Box>
  );
};

export default Market;
