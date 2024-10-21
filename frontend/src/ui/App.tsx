import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Download from "./pages/Download";
import Market from "./pages/Market";
import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import "./App.css";
import CreateWallet from "./pages/CreateWallet";
import Proxy from "./pages/Proxy";
import { ProxyProvider } from "./contexts/ProxyContext";
import { AuthProvider } from "./contexts/AuthContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProxyProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<SignIn />} />
              <Route path="/createwallet" element={<CreateWallet />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/proxy" element={<Proxy />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/download" element={<Download />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </ProxyProvider>
    </AuthProvider>
  );
};

export default App;
