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

const Signup = () => {
  const navigate = useNavigate();

  const [privateKey, setPrivateKey] = React.useState("");
  const [error, setError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const generatePrivateKey = () => {
    let key = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let counter = 0;
    while (counter < 32) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
      counter += 1;
    }
    setPrivateKey(key);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (error) {
      event.preventDefault();
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  const validateInputs = (event: React.FormEvent<HTMLFormElement>) => {
    const privateKey = document.getElementById(
      "privateKey"
    ) as HTMLInputElement;
    const confirmPrivateKey = document.getElementById(
      "confirmPrivateKey"
    ) as HTMLInputElement;

    if (confirmPrivateKey.value != privateKey.value) {
      setError(true);
      setErrorMessage("Both passwords must match");
      return;
    }
    setError(false);
    setError(false);

    handleSubmit(event);
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
          Sign Up
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2,
          }}
        >
          {privateKey ? (
            <FormControl>
              <FormLabel>Wallet ID</FormLabel>
              <TextField
                id="walletID"
                type="text"
                name="walletID"
                value={privateKey}
                fullWidth
                variant="outlined"
                disabled
              />
            </FormControl>
          ) : (
            <Button fullWidth variant="contained" onClick={generatePrivateKey}>
              Generate Wallet ID
            </Button>
          )}
          <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="privateKey">Private Key</FormLabel>
            </Box>
            <TextField
              name="privateKey"
              placeholder="••••••"
              type="privateKey"
              id="privateKey"
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="confirmPrivateKey">
                Confirm Private Key
              </FormLabel>
            </Box>
            <TextField
              error={error}
              helperText={errorMessage}
              name="confirmPrivateKey"
              placeholder="••••••"
              type="confirmPrivateKey"
              id="confirmPrivateKey"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={error ? "error" : "primary"}
            />
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={validateInputs}
          >
            Sign in
          </Button>
          <Typography sx={{ textAlign: "center" }}>
            Already have a wallet?{" "}
            <span>
              <Link
                onClick={() => navigate("/dashboard", { replace: true })}
                variant="body2"
                sx={{ alignSelf: "center", cursor: "pointer" }}
              >
                Log in
              </Link>
            </span>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Signup;
