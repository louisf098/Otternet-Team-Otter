import { HashRouter as Router, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Wallet from "./pages/Wallet";
import Market from "./pages/Market";
import "./App.css";

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/market" element={<Market />} />
            <Route path="/upload" element={<Upload />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
