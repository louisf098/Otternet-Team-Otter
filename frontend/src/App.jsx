import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Wallet from "./pages/Wallet.jsx";
import "./App.css";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
