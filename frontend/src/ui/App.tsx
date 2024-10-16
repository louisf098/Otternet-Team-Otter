import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Download from "./pages/Download";
import Wallet from "./pages/Wallet";
import Market from "./pages/Market";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import "./App.css";
import Signup from "./pages/Signup";

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/market" element={<Market />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/download" element={<Download />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
