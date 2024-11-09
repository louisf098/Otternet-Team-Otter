package config

type Config struct {
    BitcoinRPCURL      string
    BitcoinRPCUser     string
    BitcoinRPCPassword string
}

func NewConfig() *Config {
    return &Config{
        BitcoinRPCURL:      "http://127.0.0.1:8332",
        BitcoinRPCUser:     "user",
        BitcoinRPCPassword: "password",
    }
}
