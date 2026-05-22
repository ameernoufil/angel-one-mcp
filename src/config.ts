export interface SafetyConfig {
  softMaxOrderQty: number;
  hardMaxOrderQty: number;
  softMaxOrderValue: number;
  hardMaxOrderValue: number;
}

export interface Credentials {
  apiKey: string;
  clientId: string;
  password: string;
  totpSecret: string;
}

export interface Config extends Credentials, SafetyConfig {}

export const REQUIRED_ENV_VARS = [
  "ANGEL_API_KEY",
  "ANGEL_CLIENT_ID",
  "ANGEL_PASSWORD",
  "ANGEL_TOTP_SECRET",
] as const;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function formatMissingEnvMessage(missing: readonly string[]): string {
  return [
    "Missing required environment variables:",
    ...missing.map((name) => `- ${name}`),
    "",
    "Set them in your MCP client config or a local .env file before starting the server.",
    "Example:",
    "ANGEL_API_KEY=your_smartapi_key",
    "ANGEL_CLIENT_ID=your_client_id",
    "ANGEL_PASSWORD=your_mpin",
    "ANGEL_TOTP_SECRET=your_base32_totp_secret",
  ].join("\n");
}

function requireEnv(name: (typeof REQUIRED_ENV_VARS)[number]): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(formatMissingEnvMessage([name]));
  }
  return value;
}

export function loadConfig(): Config {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new ConfigError(formatMissingEnvMessage(missing));
  }

  const apiKey = requireEnv("ANGEL_API_KEY");
  const clientId = requireEnv("ANGEL_CLIENT_ID");
  const password = requireEnv("ANGEL_PASSWORD");
  const totpSecret = requireEnv("ANGEL_TOTP_SECRET");

  const parseIntSafe = (name: string, val: string | undefined, fallback: number): number => {
    if (!val) return fallback;
    const parsed = Math.floor(Number(val));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      process.stderr.write(
        `Warning: invalid value "${val}" for ${name}, using default ${fallback}\n`,
      );
      return fallback;
    }
    return parsed;
  };

  const config: Config = {
    apiKey,
    clientId,
    password,
    totpSecret,
    softMaxOrderQty: parseIntSafe("SOFT_MAX_ORDER_QTY", process.env.SOFT_MAX_ORDER_QTY, 25),
    hardMaxOrderQty: parseIntSafe("HARD_MAX_ORDER_QTY", process.env.HARD_MAX_ORDER_QTY, 100),
    softMaxOrderValue: parseIntSafe(
      "SOFT_MAX_ORDER_VALUE",
      process.env.SOFT_MAX_ORDER_VALUE,
      10000,
    ),
    hardMaxOrderValue: parseIntSafe(
      "HARD_MAX_ORDER_VALUE",
      process.env.HARD_MAX_ORDER_VALUE,
      100000,
    ),
  };

  if (config.softMaxOrderQty > config.hardMaxOrderQty) {
    throw new ConfigError(
      `SOFT_MAX_ORDER_QTY (${config.softMaxOrderQty}) must be ≤ HARD_MAX_ORDER_QTY (${config.hardMaxOrderQty})`,
    );
  }
  if (config.softMaxOrderValue > config.hardMaxOrderValue) {
    throw new ConfigError(
      `SOFT_MAX_ORDER_VALUE (${config.softMaxOrderValue}) must be ≤ HARD_MAX_ORDER_VALUE (${config.hardMaxOrderValue})`,
    );
  }

  return config;
}
