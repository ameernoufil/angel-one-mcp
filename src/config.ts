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

export function loadConfig(): Config {
  const apiKey = process.env.ANGEL_API_KEY;
  const clientId = process.env.ANGEL_CLIENT_ID;
  const password = process.env.ANGEL_PASSWORD;
  const totpSecret = process.env.ANGEL_TOTP_SECRET;

  if (!apiKey || !clientId || !password || !totpSecret) {
    const missing = [
      !apiKey && "ANGEL_API_KEY",
      !clientId && "ANGEL_CLIENT_ID",
      !password && "ANGEL_PASSWORD",
      !totpSecret && "ANGEL_TOTP_SECRET",
    ].filter(Boolean);
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

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
    throw new Error(
      `SOFT_MAX_ORDER_QTY (${config.softMaxOrderQty}) must be ≤ HARD_MAX_ORDER_QTY (${config.hardMaxOrderQty})`,
    );
  }
  if (config.softMaxOrderValue > config.hardMaxOrderValue) {
    throw new Error(
      `SOFT_MAX_ORDER_VALUE (${config.softMaxOrderValue}) must be ≤ HARD_MAX_ORDER_VALUE (${config.hardMaxOrderValue})`,
    );
  }

  return config;
}
