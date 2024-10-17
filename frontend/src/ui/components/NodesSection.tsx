import React, { useContext } from "react";
import NodeBox from "./NodeBox";
import { ProxyContext } from "../contexts/ProxyContext";
import { proxyNodes } from "../data/proxyNodes";
import "../stylesheets/NodesSection.css";

const NodesSection: React.FC = () => {
  const { selectedNode, setSelectedNode } = useContext(ProxyContext);

  // typeof proxyNodes will need to be changed once we use real data
  const handleSelect = async (node: (typeof proxyNodes)[0]) => {
    const confirm = window.confirm(
      `Establish Proxy Connection to ${node.id} for $${node.rate}/KB?`
    );
    if (confirm) {
      try {
        await setSelectedNode(node);
      } catch (e) {
        alert(`Failed to connect to ${node.id}`);
      }
    }
  };

  const handleDisconnect = async (node: (typeof proxyNodes)[0]) => {
    const confirm = window.confirm(`Disconnect from ${selectedNode?.id}?`);
    if (confirm) {
      if (selectedNode?.id === node.id) {
        try {
          setSelectedNode(null);
        } catch (e) {
          alert(`Failed to disconnect from ${node.id}`);
        }
      } else {
        alert("You are not connected to this node");
      }
    }
  };

  const sortByRate = (a: (typeof proxyNodes)[0], b: (typeof proxyNodes)[0]) => {
    return a.rate - b.rate;
  };

  return (
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
  );
};

export default NodesSection;
