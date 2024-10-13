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

const Login = () => {
  const navigate = useNavigate();

  const [error, setError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (error) {
      event.preventDefault();
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  const validateInputs = (event: React.FormEvent<HTMLFormElement>) => {
    const walletId = document.getElementById("walletID") as HTMLInputElement;
    const privateKey = document.getElementById(
      "privateKey"
    ) as HTMLInputElement;

    if (!walletId.value || !privateKey.value) {
      setError(true);
      setErrorMessage("Please fill out both wallet ID and private key");
      return;
    }
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
          Sign in
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
          <FormControl>
            <FormLabel>Wallet ID</FormLabel>
            <TextField
              error={error}
              helperText={errorMessage}
              id="walletID"
              type="text"
              name="walletID"
              placeholder="nf28y4ofb3y8ogf8gfy8g8ygo8"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={error ? "error" : "primary"}
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <FormLabel htmlFor="privateKey">Private Key</FormLabel> {}
              <Link
                component="button"
                type="button"
                variant="body2"
                sx={{ alignSelf: "baseline" }}
              >
                {} Forgot your private key?
              </Link>
            </Box>
            <TextField
              error={error}
              helperText={errorMessage}
              name="privateKey"
              placeholder="••••••"
              type="privateKey"
              id="privateKey"
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
            Don&apos;t have a wallet?{" "}
            <span>
              <Link
                onClick={() => navigate("/signup", { replace: true })}
                variant="body2"
                sx={{ alignSelf: "center", cursor: "pointer" }}
              >
                Sign up
              </Link>
            </span>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;
