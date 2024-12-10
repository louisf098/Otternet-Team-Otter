import ProxyPref from "../components/ProxyPref";
import NodesSection from "../components/NodesSection";
import { proxyNodes } from "../data/proxyNodes";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { useContext, useState } from "react";
import { ProxyContext } from "../contexts/ProxyContext";

const Proxy = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);
  const [pDisconnect, setPDisconnect] = useState<boolean>(false);


  const handleDisconnect = async (nodeId: string) => {
    const node = proxyNodes.find((n) => n.id === nodeId);
    if (node) {
      setPDisconnect(true);
      setTimeout(() => {
        console.log("Disconnecting from node", nodeId);
        setSelectedNode(null);
        setPDisconnect(false);
      }, 1000);
    }
  };

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
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="h6">
            Connected to Proxy Node ID:{" "}
            <span style={{ fontWeight: "bold", color: "blue" }}>
              {selectedNode.id}
            </span>
          </Typography>

          {pDisconnect ? (
            <CircularProgress size={24} sx={{ mt: 1 }} />
          ) : (
            <Button
              sx={{ mt: 1 }}
              variant="outlined"
              onClick={() => handleDisconnect(selectedNode.id)}
            >
              Disconnect
            </Button>
          )}
        </Box>
      ) : null}
      <NodesSection />
    </Box>
  );
};

export default Proxy;
