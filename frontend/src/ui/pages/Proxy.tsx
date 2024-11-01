import ProxyPref from "../components/ProxyPref";
import NodesSection from "../components/NodesSection";
import { proxyNodes } from "../data/proxyNodes";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useContext, useState } from "react";
import { ProxyContext } from "../contexts/ProxyContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const Proxy = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);
  const [pDisconnect, setPDisconnect] = useState<boolean>(false);

  // States to control visibility of each section
  const [showProxyPref, setShowProxyPref] = useState(true);
  const [showNodesSection, setShowNodesSection] = useState(true);
  const [showProxiesConnected, setShowProxiesConnected] = useState(true);

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
      {/* Section for Proxy Pref */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h4" sx={{ textAlign: "left", flexGrow: 1 }}>
          Configure Your Node for Proxy Use
        </Typography>
        <IconButton onClick={() => setShowProxyPref(!showProxyPref)}>
          {showProxyPref ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      {showProxyPref && <ProxyPref />}

      {/* Section for Nodes */}
      <Box sx={{ display: "flex", alignItems: "center", mt: 4 }}>
        <Typography variant="h4" sx={{ textAlign: "left", flexGrow: 1 }}>
          Select a Proxy Node
        </Typography>
        <IconButton onClick={() => setShowNodesSection(!showNodesSection)}>
          {showNodesSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      {showNodesSection && (
        <>
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
        </>
      )}
      {/* Section for Nodes Connected to My Proxy */}
      <Box sx={{ display: "flex", alignItems: "center", mt: 4 }}>
        <Typography variant="h4" sx={{ textAlign: "left", flexGrow: 1 }}>
          Nodes Connected to My Proxy
        </Typography>
        <IconButton
          onClick={() => setShowProxiesConnected(!showProxiesConnected)}
        >
          {showProxiesConnected ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      {showProxiesConnected && (
        <>
          <Typography>Proxies Connected to Me</Typography>
        </>
      )}
    </Box>
  );
};

export default Proxy;
