import React, { useContext, useState } from "react";
import NodeBox from "./NodeBox";
import { ProxyContext } from "../contexts/ProxyContext";
import { proxyNodes } from "../data/proxyNodes";
import { ProxyData } from "../interfaces/File";
import { IconButton, Snackbar, SnackbarCloseReason } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "../stylesheets/NodesSection.css";

const NodesSection: React.FC = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSelect = async (
    node: (typeof proxyNodes)[0]
  ): Promise<boolean> => {
    try {
      const proxyData: ProxyData = {
        id: node.id,
        ipAddr: node.ip,
        price: node.rate,
        timestamp: new Date().toISOString(),
      };

      const success = await connectToProxy(proxyData);
      if (success) {
        await setSelectedNode(node);
        return true; // Successfully connected
      } else {
        return false; // Failed to connect
      }
    } catch (e) {
      console.error("Failed to connect to proxy:", e);
      return false;
    }
  };

  const connectToProxy = async (proxyData: ProxyData): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:9378/connectToProxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proxyData),
      });

      if (response.status === 200) {
        setSnackbarMessage("Connected to proxy");
        setSnackbarOpen(true);
        return true; // Connection succeeded
      } else {
        setSnackbarMessage("Failed to connect to proxy");
        setSnackbarOpen(true);
        return false; // Connection failed
      }
    } catch (err) {
      console.error("Error connecting to proxy:", err);
      setSnackbarMessage("Error connecting to proxy");
      setSnackbarOpen(true);
      return false; // Error occurred
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

  const handleDisconnect = async (node: (typeof proxyNodes)[0]) => {
    if (selectedNode?.id === node.id) {
      try {
        setSelectedNode(null);
      } catch (e) {
        alert(`Failed to disconnect from ${node.id}`);
      }
    } else {
      alert("You are not connected to this node");
    }
  };

  const sortByRate = (a: (typeof proxyNodes)[0], b: (typeof proxyNodes)[0]) => {
    return a.rate - b.rate;
  };

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
