import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import "../stylesheets/NodeBox.css";

export interface ProxyNode {
  id: string;
  pricePerHour: number;
  ip: string;
  port: number;
}

interface NodeBoxProps {
  node: ProxyNode;
  isSelected: boolean; // Add this to the props
  onSelect: (node: ProxyNode) => Promise<boolean>;
  onDisconnect: (node: ProxyNode) => Promise<void>; // Ensure async consistency
}

const NodeBox: React.FC<NodeBoxProps> = ({
  node,
  isSelected,
  onSelect,
  onDisconnect,
}) => {
  const [pConnect, setPConnect] = useState<boolean>(false);
  const [pDisconnect, setPDisconnect] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Track loading state
  const [showModal, setShowModal] = useState<boolean>(false); // State for modal
  const [showDetails, setShowDetails] = useState<boolean>(isSelected); // State to show IP and Port

  const handleSelect = () => {
    setShowModal(true); // Open modal on Connect click
  };

  const handlePConnect = async () => {
    setIsLoading(true);
    try {
      const success = await onSelect(node);
      if (success) {
        setTimeout(() => {
          setPConnect(false);
          setIsLoading(false);
          setShowDetails(true); // Show IP and Port after connection
          setShowModal(false); // Close modal after successful connection
        }, 2000);
      } else {
        alert("Failed to connect to proxy. Please check the server.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error connecting to proxy:", error);
      alert("Failed to connect to proxy. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPConnect(false);
    setShowModal(false); // Close modal on Cancel
  };

  const handleDisconnect = async () => {
    setPDisconnect(true);
    try {
      await onDisconnect(node);
      setShowDetails(false); // Hide IP and Port on disconnect
    } catch (error) {
      console.error("Error disconnecting from proxy:", error);
    } finally {
      setPDisconnect(false);
    }
  };

  return (
    <div className={`${isSelected ? "selected" : ""} node-box`}>
      <Typography variant="h6">
        <span style={{ fontWeight: "bold" }}>{`${node.id.slice(0, 8)}...`}</span>
      </Typography>
      <Typography variant="body1">Rate: {node.pricePerHour} OTTC/KB</Typography>
      {showDetails && (
        <>
          <Typography variant="body1">
            <strong>Public IP:</strong> {node.ip}
          </Typography>
          <Typography variant="body1">
            <strong>Port:</strong> 8081
          </Typography>
        </>
      )}
      {!isSelected && !pConnect && (
        <Button onClick={handleSelect}>Connect</Button>
      )}
      {!isSelected && pConnect && (
        <div>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Button onClick={handlePConnect} disabled={isLoading}>
                Confirm
              </Button>
              <Button onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
      {isSelected && <Typography className="status">Connected</Typography>}
      {isSelected && (
        <>
          {pDisconnect ? (
            <CircularProgress size={24} />
          ) : (
            <Button onClick={handleDisconnect}>Disconnect</Button>
          )}
        </>
      )}

      {/* Modal for confirmation */}
      <Dialog open={showModal} onClose={handleCancel}>
        <DialogTitle>Confirm Connection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to connect to this proxy node?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="secondary">
            Cancel
          </Button>
          <Button onClick={handlePConnect} color="primary" disabled={isLoading}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NodeBox;
