import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Wallet from "./pages/Wallet.jsx";
import Market from "./pages/Market.jsx";
import "./App.css";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/market" element={<Market />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
