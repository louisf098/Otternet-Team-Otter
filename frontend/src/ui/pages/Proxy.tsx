import ProxyPref from "../components/ProxyPref";
import ProxyList from "../components/ProxyList";
import { Box } from "@mui/material";

const Proxy = () => {
  return (
    <Box>
      <ProxyPref />
      <ProxyList />
    </Box>
  );
};

export default Proxy;
