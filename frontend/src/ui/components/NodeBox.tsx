import React from "react";
import Typography from "@mui/material/Typography";
import '../stylesheets/NodeBox.css';

export interface ProxyNode {
    id: string;
    rate: number;
    ip: string;
    port: number;
}

export interface ProxyNodeContext {
    selectedNode: ProxyNode | null;
    setSelectedNode: (node: ProxyNode | null) => void;
}

interface NodeBoxProps {
    node: ProxyNode;
    isSelected: boolean;
    onSelect: (node: ProxyNode) => void;
    onDisconnect: (node: ProxyNode) => void;
}

const NodeBox: React.FC<NodeBoxProps> = ({ node, isSelected, onSelect, onDisconnect }) => {
    const handleSelect = () => {
        onSelect(node);
    }
    const handleDisconnect = (e: React.MouseEvent) => {
        console.log('disconnecting');
        onDisconnect(node);
    };

    return (
        <div
          className={`${isSelected ? 'selected' : ''} node-box`}
        >
            <Typography variant="h6">{node.id}</Typography>
            <Typography variant="body1">Rate: ${node.rate}/KB</Typography>
            <Typography variant="body1">IP: {node.ip}</Typography>
            <Typography variant="body1">Port: {node.port}</Typography>
            {!isSelected && <button onClick={handleSelect}>Connect</button>}
            {isSelected && <span className="status">Connected</span>}
            {isSelected && <button onClick={handleDisconnect}>Disconnect</button>}  
        </div>
      );
}

export default NodeBox;