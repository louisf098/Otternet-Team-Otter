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
  onSelect: (node: ProxyNode) => void;
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
    // onSelect(node);
    setPConnect(true);
  };
  const handlePConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      onSelect(node);
      setPConnect(false);
      setIsLoading(false);
    }, 1000);
  };
  const handleCancel = () => {
    setPConnect(false);
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
      {/* <Typography variant="body1">Port: {node.port}</Typography> */}
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
