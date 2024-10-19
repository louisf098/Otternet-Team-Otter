import ProxyPref from "../components/ProxyPref";
import NodesSection from "../components/NodesSection";
import { Box, Typography } from "@mui/material";
import { useContext } from "react";
import { ProxyContext } from "../contexts/ProxyContext";

const Proxy = () => {
  const { selectedNode } = useContext(ProxyContext);

  return (
    <Box sx={{ m: 4, width: "85%" }}>
      <Typography variant="h4" sx={{ textAlign: "left" }}>
        Configure Your Node for Proxy Use
      </Typography>
      <ProxyPref />
      <Typography variant="h4" sx={{ textAlign: "left" }}>
        Select a Proxy Node
      </Typography>
      {selectedNode ? (
        <Typography variant="h6" sx={{ textAlign: "center" }}>
          Connected to Proxy Node ID:{" "}
          <span style={{ fontWeight: "bold", color: "blue" }}>
            {selectedNode.id}
          </span>
        </Typography>
      ) : null}
      <NodesSection />
    </Box>
  );
};

export default Proxy;
