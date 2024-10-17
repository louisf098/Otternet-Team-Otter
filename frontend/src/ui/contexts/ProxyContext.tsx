import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useStopwatch } from "react-timer-hook";
import { ProxyNode } from "../components/NodeBox";

export interface ProxyNodeContext {
  selectedNode: ProxyNode | null;
  setSelectedNode: (node: ProxyNode | null) => void;
  proxyEnabled: boolean;
  setProxyEnabled: (enabled: boolean) => void;
  rate: number | string; // string for "" initially
  setRate: (rate: number | string) => void;
  port: number | string; // string for "" initially
  setPort: (port: number | string) => void;
  elapsedTime: number;
}

export const ProxyContext = createContext<ProxyNodeContext>({
  selectedNode: null,
  setSelectedNode: () => {},
  proxyEnabled: true,
  setProxyEnabled: () => {},
  rate: "",
  setRate: () => {},
  port: "",
  setPort: () => {},
  elapsedTime: 0,
});

interface ProxyProviderProps {
  children: ReactNode;
}

export const ProxyProvider: React.FC<ProxyProviderProps> = ({ children }) => {
  const [selectedNode, setSelectedNode] = useState<ProxyNode | null>(null);
  const [proxyEnabled, setProxyEnabled] = useState<boolean>(false);
  const [rate, setRate] = useState<number | string>("");
  const [port, setPort] = useState<number | string>("");

  const { seconds, minutes, hours, start, pause, reset } = useStopwatch({
    autoStart: false,
  });

  useEffect(() => {
    if (proxyEnabled) {
      reset();
      start(); // Reset and start the timer when proxy is enabled
    } else {
      pause(); // Pause the timer when proxy is disabled
    }
  }, [proxyEnabled]);

  const elapsedTime = hours * 3600 + minutes * 60 + seconds;

  useEffect(() => {
    const prevSelectedNode = localStorage.getItem("selectedNode");
    const savedProxyEnabled = localStorage.getItem("proxyEnabled");
    const savedRate = localStorage.getItem("rate");
    const savedPort = localStorage.getItem("port");

    if (prevSelectedNode) {
      setSelectedNode(JSON.parse(prevSelectedNode));
    }
    if (savedProxyEnabled) {
      setProxyEnabled(JSON.parse(savedProxyEnabled));
    }
    if (savedRate) {
      setRate(Number(savedRate));
    }
    if (savedPort) {
      setPort(Number(savedPort));
    }
  }, []);

  useEffect(() => {
    if (selectedNode) {
      localStorage.setItem("selectedNode", JSON.stringify(selectedNode));
      console.log("Successfully connected to", selectedNode.id);
    } else {
      localStorage.removeItem("selectedNode");
      console.log("Disconnected from node");
    }
  }, [selectedNode]);

  useEffect(() => {
    localStorage.setItem("proxyEnabled", JSON.stringify(proxyEnabled));
    localStorage.setItem("rate", rate.toString());
    localStorage.setItem("port", port.toString());
    localStorage.setItem("elapsedTime", elapsedTime.toString());
    console.log(`Info: ${proxyEnabled}, ${rate}, ${port}, ${elapsedTime}`);
  }, [proxyEnabled, rate, port, elapsedTime]);

  return (
    <ProxyContext.Provider
      value={{
        selectedNode,
        setSelectedNode,
        proxyEnabled,
        setProxyEnabled,
        rate,
        setRate,
        port,
        setPort,
        elapsedTime,
      }}
    >
      {children}
    </ProxyContext.Provider>
  );
};
