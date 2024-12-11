import React, { useContext, useEffect, useState } from "react";
import NodeBox from "./NodeBox";
import { ProxyContext } from "../contexts/ProxyContext";
import { ProxyNode } from "./NodeBox";
import { IconButton, Snackbar, SnackbarCloseReason } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "../stylesheets/NodesSection.css";

const NodesSection: React.FC = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);
  const [proxyNodes, setProxyNodes] = useState<ProxyNode[]>([]); // Dynamic proxy nodes
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchProxies = async () => {
      try {
        const response = await fetch("http://localhost:9378/fetchAvailableProxies");
        if (!response.ok) {
          throw new Error(`Failed to fetch proxies: ${response.statusText}`);
        }

        const data: ProxyNode[] = await response.json();
        // Filter out nodes with IP 127.0.0.1
        const filteredNodes = data.filter((node) => node.ip !== "127.0.0.1");
        setProxyNodes(filteredNodes);
      } catch (error) {
        console.error("Error fetching proxy nodes:", error);
        setSnackbarMessage("Failed to load proxy nodes.");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProxies();
  }, []);

  const handleSelect = async (node: ProxyNode): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:9378/connectToProxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientAddr: node.ip }),
      });

      if (response.status === 200) {
        setSnackbarMessage("Connected to proxy");
        setSnackbarOpen(true);
        setSelectedNode(node);
        return true;
      } else {
        setSnackbarMessage("Failed to connect to proxy");
        setSnackbarOpen(true);
        return false;
      }
    } catch (error) {
      console.error("Error connecting to proxy:", error);
      setSnackbarMessage("Error connecting to proxy");
      setSnackbarOpen(true);
      return false;
    }
  };

  const handleDisconnect = async (node: ProxyNode) => {
    if (selectedNode?.id === node.id) {
      try {
        await fetch("http://localhost:9378/disconnectFromProxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientAddr: node.ip }),
        });

        setSelectedNode(null);
        setSnackbarMessage("Disconnected from proxy");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error disconnecting from proxy:", error);
        setSnackbarMessage("Failed to disconnect from proxy");
        setSnackbarOpen(true);
      }
    } else {
      alert("You are not connected to this node");
    }
  };

  const handleCloseSnackbar = (
    event: React.SyntheticEvent<any, Event> | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const sortByRate = (a: ProxyNode, b: ProxyNode) => a.pricePerHour - b.pricePerHour;

  if (loading) {
    return <div>Loading proxy nodes...</div>;
  }

  return (
    <>
      <div className="nodes-section">
        {proxyNodes.sort(sortByRate).map((node) => (
          <NodeBox
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={handleSelect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default NodesSection;
