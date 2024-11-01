import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import { Button, CircularProgress } from "@mui/material";
import "../stylesheets/NodeBox.css";

export interface ProxyNode {
  id: string;
  rate: number;
  ip: string;
  port: number;
}

interface NodeBoxProps {
  node: ProxyNode;
  isSelected: boolean;
  onSelect: (node: ProxyNode) => Promise<boolean>; // Adjust to expect a promise that returns success status
  onDisconnect: (node: ProxyNode) => void;
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

  const handleSelect = () => {
    setPConnect(true);
  };

  const handlePConnect = async () => {
    setIsLoading(true);

    try {
      const success = await onSelect(node);
      if (success) {
        setTimeout(() => {
          setPConnect(false);
          setIsLoading(false);
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
    setIsLoading(false);
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    setPDisconnect(true);
    setTimeout(() => {
      console.log("disconnecting");
      onDisconnect(node);
      setPDisconnect(false);
    }, 1000);
  };

  return (
    <div className={`${isSelected ? "selected" : ""} node-box`}>
      <Typography variant="h6">
        <span style={{ fontWeight: "bold" }}>{node.id}</span>
      </Typography>
      <Typography variant="body1">Rate: {node.rate} OTTC/KB</Typography>
      <Typography variant="body1">IP: {node.ip}</Typography>
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
    </div>
  );
};

export default NodeBox;
