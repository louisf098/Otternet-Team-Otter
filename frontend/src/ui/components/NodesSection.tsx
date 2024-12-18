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
  const [userPublicIP, setUserPublicIP] = useState<string>(""); // Client's public IP
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch user's public IP
  useEffect(() => {
    const fetchPublicIP = async () => {
      try {
        const response = await fetch("http://localhost:9378/getPublicIP"); // Adjust the endpoint as needed
        if (!response.ok) throw new Error("Failed to fetch public IP");
        const ip = await response.text();
        setUserPublicIP(ip.trim());
      } catch (error) {
        console.error("Error fetching public IP:", error);
        setSnackbarMessage("Failed to fetch public IP.");
        setSnackbarOpen(true);
      }
    };

    fetchPublicIP();
  }, []);

  // Fetch available proxies
  useEffect(() => {
    const fetchProxies = async () => {
      try {
        const response = await fetch("http://localhost:9378/getActiveProxies"); // Adjust the endpoint as needed
        if (!response.ok) {
          throw new Error(`Failed to fetch proxies: ${response.statusText}`);
        }

        const data: ProxyNode[] = await response.json();
        // Filter out nodes with IP 127.0.0.1
        const filteredNodes = data.filter((node) => node.ip !== "127.0.0.1");
        const uniqueNodes = filteredNodes.filter((node, index, self) =>
          index === self.findIndex((t) => t.ip === node.ip)
        );
        
        uniqueNodes.forEach(node => {
          console.log(node.ip);
        });
        setProxyNodes(uniqueNodes);
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
    if (!userPublicIP) {
      setSnackbarMessage("Failed to retrieve public IP. Cannot connect.");
      setSnackbarOpen(true);
      return false;
    }

    try {
      const response = await fetch("http://localhost:9378/proxy/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          clientAddr: userPublicIP,
          serverID: node.id
        }), // Use the client's IP
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
        await fetch("http://localhost:9378/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            clientAddr: userPublicIP,
            serverID: node.ip
          }),
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
