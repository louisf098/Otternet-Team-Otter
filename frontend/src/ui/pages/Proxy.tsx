import ProxyPref from "../components/ProxyPref";
import NodesSection from "../components/NodesSection";
import { Box, Typography } from "@mui/material";

const Proxy = () => {
  return (
    <Box sx={{ m: 4, width: "85%" }}>
      <Typography variant="h4" sx={{ textAlign: "left" }}>
        Configure Your Node for Proxy Use
      </Typography>
      <ProxyPref />
      <Typography variant="h4" sx={{ textAlign: "left" }}>
        Select a Proxy Node
      </Typography>
      <NodesSection />
    </Box>
  );
};

export default Proxy;
