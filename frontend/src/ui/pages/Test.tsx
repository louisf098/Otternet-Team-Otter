import React from "react";
import NodesSection from "../components/NodesSection";

interface TestProps{}
const Test: React.FC<TestProps> = () => {
    return (
        <div>
            <h1>Test</h1>
            <NodesSection />
        </div>
    );
};

export default Test;