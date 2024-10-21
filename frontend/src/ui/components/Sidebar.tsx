import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import FolderIcon from "@mui/icons-material/Folder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import PublicIcon from "@mui/icons-material/Public";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import logo from "../public/assets/icons/logo-no-background.svg";
import { AuthContext } from "../contexts/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState(false);

  const { publicKey } = useContext(AuthContext);

  useEffect(() => {
    setHidden(publicKey != "");
  }, [publicKey]);

  return (
    hidden && (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ width: collapsed ? "55px" : "205px" }}>
          <Box sx={{ m: 1, display: "flex" }}>
            <img src={logo} width={50} height={50} alt="OrcaNet Logo" />
            <Typography
              variant="h6"
              component="a"
              sx={{
                ml: 2,
                mt: 1,
                display: { xs: "none", md: "flex" },
                justifyContent: "right",
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {collapsed ? "" : "tterNet"}
            </Typography>
          </Box>
          <List>
            <ListItem key={1} disablePadding>
              <ListItemButton
                onClick={() => navigate("/dashboard", { replace: true })}
              >
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Dashboard"}
                  sx={{ display: collapsed ? "none" : "inline-block" }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem key={2} disablePadding>
              <ListItemButton
                onClick={() => navigate("/market", { replace: true })}
              >
                <ListItemIcon>
                  <ShoppingCartIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Market"}
                  sx={{ display: collapsed ? "none" : "inline-block" }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem key={3} disablePadding>
              <ListItemButton
                onClick={() => navigate("/proxy", { replace: true })}
              >
                <ListItemIcon>
                  <PublicIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Proxy"}
                  sx={{ display: collapsed ? "none" : "inline-block" }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem key={4} disablePadding>
              <ListItemButton
                onClick={() => navigate("/upload", { replace: true })}
              >
                <ListItemIcon>
                  <FileUploadIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Upload"}
                  sx={{ display: collapsed ? "none" : "inline-block" }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem key={5} disablePadding>
              <ListItemButton
                onClick={() => navigate("/download", { replace: true })}
              >
                <ListItemIcon>
                  <FileDownloadIcon />
                </ListItemIcon>
                <ListItemText
                  primary={"Download"}
                  sx={{ display: collapsed ? "none" : "inline-block" }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            width: collapsed ? "50px" : "170px",
            justifyContent: "space-between",
            px: 1,
          }}
        >
          <IconButton onClick={() => navigate("/settings", { replace: true })}>
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={() => setCollapsed(!collapsed)}>
            <NavigateBeforeIcon />
          </IconButton>
        </Box>
      </Box>
    )
  );
};

export default Sidebar;
