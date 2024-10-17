import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Wallet from "./pages/Wallet";
import Market from "./pages/Market";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import "./App.css";
import Signup from "./pages/Signup";
import Proxy from "./pages/Proxy";
import { ProxyProvider } from "./contexts/ProxyContext";

const App: React.FC = () => {
  return (
    <ProxyProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/market" element={<Market />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/proxy" element={<Proxy />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ProxyProvider>
  );
};

export default App;
