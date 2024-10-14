import React, { createContext, useState, useEffect, ReactNode } from "react";
import { ProxyNode, ProxyNodeContext } from "../components/NodeBox";

export const ProxyContext = createContext<ProxyNodeContext>({
    selectedNode: null,
    setSelectedNode: () => {}
});

interface ProxyProviderProps {
    children: ReactNode;
}

export const ProxyProvider: React.FC<ProxyProviderProps> = ({ children }) => {
    const [selectedNode, setSelectedNode] = useState<ProxyNode | null>(null);

    useEffect(() => {
        const prevSelectedNode = localStorage.getItem('selectedNode');
        if (prevSelectedNode) {
            setSelectedNode(JSON.parse(prevSelectedNode));
        }
    })  

    useEffect(() => {
        if (selectedNode) {
            localStorage.setItem('selectedNode', JSON.stringify(selectedNode));
            console.log("Successfully connected to", selectedNode.id);
        } else {
            localStorage.removeItem('selectedNode');
            console.log("Disconnected from node");
        }
    }, [selectedNode]);

    return (
        <ProxyContext.Provider value={{ selectedNode, setSelectedNode }}>
            {children}
        </ProxyContext.Provider>
    );
}