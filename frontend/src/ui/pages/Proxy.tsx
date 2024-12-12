import ProxyPref from "../components/ProxyPref";
import NodesSection from "../components/NodesSection";
import { Box, Typography, Button, CircularProgress, Snackbar, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useContext, useState, useEffect } from "react";
import { ProxyContext } from "../contexts/ProxyContext";

const Proxy = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);
  const [pDisconnect, setPDisconnect] = useState<boolean>(false);
  const [userPublicIP, setUserPublicIP] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchPublicIP = async () => {
      try {
        const response = await fetch("/getPublicIP");
        if (!response.ok) throw new Error("Failed to fetch public IP");
        const ip = await response.text();
        setUserPublicIP(ip.trim());
      } catch (error) {
        console.error("Error fetching public IP:", error);
      }
    };
    fetchPublicIP();
  }, []);

  const handleDisconnect = async () => {
    console.log("Disconnect initiated. Public IP:", userPublicIP);

    if (!userPublicIP) {
      setSnackbarMessage("Failed to retrieve public IP. Cannot disconnect.");
      setSnackbarOpen(true);
      return;
    }

    setPDisconnect(true);

    try {
      const response = await fetch("http://localhost:9378/proxy/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          clientAddr: userPublicIP,
          serverID: selectedNode?.id
        }),
      });

      if (response.ok) {
        console.log(`Successfully disconnected from proxy with IP ${userPublicIP}`);
        setSelectedNode(null);
        setSnackbarMessage("Disconnected from proxy");
        setSnackbarOpen(true);
      } else {
        const errorText = await response.text();
        console.error("Failed to disconnect. Server response:", errorText);
        setSnackbarMessage(`Failed to disconnect: ${errorText}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
      setSnackbarMessage("An error occurred while disconnecting. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setPDisconnect(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Public IP:</strong> {selectedNode.ip}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Port:</strong> 8081
          </Typography>
          {pDisconnect ? (
            <CircularProgress size={24} sx={{ mt: 1 }} />
          ) : (
            <Button
              sx={{ mt: 1 }}
              variant="outlined"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </Box>
      ) : null}
      <NodesSection />
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
    </Box>
  );
};

export default Proxy;
