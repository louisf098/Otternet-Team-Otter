import ProxyPref from "../components/ProxyPref";
// import ProxyList from "../components/ProxyList";
import NodesSection from "../components/NodesSection";
import { Box } from "@mui/material";

const Proxy = () => {
  return (
    <Box sx={{ width: "85%" }}>
      <ProxyPref />
      <NodesSection />
    </Box>
  );
};

export default Proxy;
