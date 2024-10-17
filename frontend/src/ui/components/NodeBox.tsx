import React from "react";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
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
  const handleSelect = () => {
    onSelect(node);
  };
  const handleDisconnect = (e: React.MouseEvent) => {
    console.log("disconnecting");
    onDisconnect(node);
  };

  return (
    <div className={`${isSelected ? "selected" : ""} node-box`}>
      <Typography variant="h6">{node.id}</Typography>
      <Typography variant="body1">Rate: {node.rate} OTTC/KB</Typography>
      <Typography variant="body1">IP: {node.ip}</Typography>
      <Typography variant="body1">Port: {node.port}</Typography>
      {!isSelected && <Button onClick={handleSelect}>Connect</Button>}
      {isSelected && <Typography className="status">Connected</Typography>}
      {isSelected && <Button onClick={handleDisconnect}>Disconnect</Button>}
    </div>
  );
};

export default NodeBox;
