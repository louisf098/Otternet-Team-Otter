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
import IconButton from "@mui/material/IconButton";
import { SnackbarCloseReason } from "@mui/material";
import Close from "@mui/icons-material/Close";
import Snackbar from "@mui/material/Snackbar";
import { useState } from "react";

const App: React.FC = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSnackbarClose = (
    event: React.SyntheticEvent<any, Event> | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <AuthProvider>
        <ProxyProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<SignIn />} />
                <Route
                  path="/createwallet"
                  element={
                    <CreateWallet
                      setSnackbarOpen={setSnackbarOpen}
                      setSnackbarMessage={setSnackbarMessage}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      setSnackbarOpen={setSnackbarOpen}
                      setSnackbarMessage={setSnackbarMessage}
                    />
                  }
                />
                <Route path="/market" element={<Market />} />
                <Route path="/proxy" element={<Proxy />} />
                <Route
                  path="/upload"
                  element={
                    <Upload
                      setSnackbarOpen={setSnackbarOpen}
                      setSnackbarMessage={setSnackbarMessage}
                    />
                  }
                />
                <Route
                  path="/download"
                  element={
                    <Download
                      setSnackbarOpen={setSnackbarOpen}
                      setSnackbarMessage={setSnackbarMessage}
                    />
                  }
                />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </ProxyProvider>
      </AuthProvider>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default App;
