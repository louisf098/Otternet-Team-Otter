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

  return (
    <Box sx={{ width: 250 }}>
      <Box
        sx={{ m: 1, mb: 2, display: "flex", justifyContent: "space-around" }}
      >
        <img src={logo} width={50} height={50} alt="OrcaNet Logo" />

        <Typography
          variant="h6"
          noWrap
          component="a"
          sx={{
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
            <ListItemText primary={"Dashboard"} />
          </ListItemButton>
        </ListItem>
        <ListItem key={2} disablePadding>
          <ListItemButton
            onClick={() => navigate("/wallet", { replace: true })}
          >
            <ListItemIcon>
              <AttachMoneyIcon />
            </ListItemIcon>
            <ListItemText primary={"Wallet/Mining"} />
          </ListItemButton>
        </ListItem>
        <ListItem key={3} disablePadding>
          <ListItemButton href="/market">
            <ListItemIcon>
              <ShoppingCartIcon />
            </ListItemIcon>
            <ListItemText primary={"Market"} />
          </ListItemButton>
        </ListItem>
        <ListItem key={4} disablePadding>
          <ListItemButton href="/settings">
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={"Settings"} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box
        sx={{
          m: 1,
          position: "fixed",
          bottom: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <IconButton>
            <SettingsIcon />
          </IconButton>
          <IconButton>
            <NavigateBeforeIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
