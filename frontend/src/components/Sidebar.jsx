import { useState } from "react";
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
import logo from "../public/assets/icons/logo-no-background.svg";

const Sidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: collapsed ? 75 : 200,
      }}
    >
      <Box>
        <Box sx={{ m: 1, display: "flex" }}>
          <img src={logo} width={50} height={50} alt="OrcaNet Logo" />
          <Typography
            variant="h6"
            noWrap
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
            OtterNet
          </Typography>
        </Box>
        <List>
          <ListItem key={1} disablePadding>
            <ListItemButton onClick={() => navigate("/", { replace: true })}>
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
              onClick={() => navigate("/wallet", { replace: true })}
            >
              <ListItemIcon>
                <AttachMoneyIcon />
              </ListItemIcon>
              <ListItemText
                primary={"Wallet/Mining"}
                sx={{ display: collapsed ? "none" : "inline-block" }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem key={3} disablePadding>
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
        </List>
      </Box>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          width: collapsed ? "50px" : "200px",
          justifyContent: "space-between",
          px: 1,
        }}
      >
        <IconButton>
          <SettingsIcon />
        </IconButton>
        <IconButton onClick={() => setCollapsed(!collapsed)}>
          <NavigateBeforeIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Sidebar;
