import * as React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import logo from "../public/assets/icons/logo-no-background.svg";
import Card from "@mui/material/Card";
import Tooltip from "@mui/material/Tooltip";
import { AuthContext } from "../contexts/AuthContext";
import { unlockWallet } from "../apis/bitcoin-core";

const SignIn = () => {
  const navigate = useNavigate();

  const [error, setError] = React.useState<string>("");

  const { setPublicKey, setWalletName } = React.useContext(AuthContext);

  const validateInputs = async () => {
    const address = document.getElementById("address") as HTMLInputElement;
    const passphrase = document.getElementById(
      "passphrase"
    ) as HTMLInputElement;

    if (!address.value || !passphrase.value) {
      setError("Please fill out both wallet ID and private key");
      return;
    }
    let res = await unlockWallet(address.value, passphrase.value);
    if (res.status != "unlocked") {
      setError(res.status);
      return;
    } else {
      setWalletName(res.walletName);
      console.log(res.status);
      setError("");
    }

    const response = await fetch(
      `http://localhost:9378/startDHT/${address.value}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);
    setPublicKey(address.value);

    navigate("/dashboard", { replace: true });
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        m: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ m: 1, display: "flex" }}>
        <img src={logo} width={100} height={100} alt="OrcaNet Logo" />
        <Typography
          variant="h2"
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
          tterNet
        </Typography>
      </Box>
      <Card
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignSelf: "center",
          width: "400px",
          padding: 4,
          gap: 2,
          margin: "auto",
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
        >
          Sign in
        </Typography>
        <Box>
          <Tooltip
            title="Make sure to close the frontend and server. Go to where the wallet is stored. Mac: ~/Library/Application\ Support/Bitcoin/wallets Ubuntu: ~/.bitcoin/wallets. Put the wallet backup file in there. Restart frontend and server."
            arrow
          >
            <span>
              <Button disabled>Import Wallet</Button>
            </span>
          </Tooltip>
        </Box>

        <Box
          component="form"
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel>Address</FormLabel>
            <TextField
              error={
                error !=
                  "Error: The wallet passphrase entered was incorrect." &&
                error != ""
              }
              helperText={
                error != "Error: The wallet passphrase entered was incorrect."
                  ? error
                  : ""
              }
              id="address"
              type="text"
              name="address"
              placeholder="nf28y4ofb3y8ogf8gfy8g8ygo8"
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="privateKey">Passphrase</FormLabel> {}
            </Box>
            <TextField
              error={error != "Incorrect address format" && error != ""}
              helperText={error != "Incorrect address format" ? error : ""}
              name="passphrase"
              placeholder="••••••"
              type="password"
              id="passphrase"
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <Button fullWidth variant="contained" onClick={validateInputs}>
            Sign In
          </Button>
          <Typography sx={{ textAlign: "center" }}>
            Don&apos;t have a wallet?{" "}
            <span>
              <Link
                onClick={() => navigate("/createwallet", { replace: true })}
                variant="body2"
                sx={{ alignSelf: "center", cursor: "pointer" }}
              >
                Create Wallet
              </Link>
            </span>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default SignIn;
