import type { SafetyConfig } from "@/config.js";

export interface GuardResult {
  allowed: boolean;
  error?: string;
  warning?: string;
}

export function validateOrderLimits(
  config: SafetyConfig,
  qty: number,
  price: number | null,
  force: boolean,
): GuardResult {
  if (!Number.isFinite(qty) || qty <= 0) {
    return { allowed: false, error: `Invalid quantity: must be a finite positive number` };
  }

  if (qty > config.hardMaxOrderQty) {
    return {
      allowed: false,
      error: `HARD LIMIT: Quantity ${qty} exceeds maximum ${config.hardMaxOrderQty}. Change HARD_MAX_ORDER_QTY env var to increase.`,
    };
  }

  if (price !== null) {
    if (!Number.isFinite(price) || price <= 0) {
      return { allowed: false, error: `Invalid price: must be a finite positive number` };
    }
    const value = qty * price;
    if (value > config.hardMaxOrderValue) {
      return {
        allowed: false,
        error: `HARD LIMIT: Order value ₹${value.toLocaleString("en-IN")} (${qty} × ₹${price}) exceeds maximum ₹${config.hardMaxOrderValue.toLocaleString("en-IN")}. Change HARD_MAX_ORDER_VALUE env var to increase.`,
      };
    }
  }

  if (!force) {
    if (qty > config.softMaxOrderQty) {
      return {
        allowed: false,
        error: `Quantity ${qty} exceeds soft limit ${config.softMaxOrderQty}. Pass force: true to override, or change SOFT_MAX_ORDER_QTY env var.`,
      };
    }

    if (price !== null) {
      const value = qty * price;
      if (value > config.softMaxOrderValue) {
        return {
          allowed: false,
          error: `Order value ₹${value.toLocaleString("en-IN")} (${qty} × ₹${price}) exceeds soft limit ₹${config.softMaxOrderValue.toLocaleString("en-IN")}. Pass force: true to override, or change SOFT_MAX_ORDER_VALUE env var.`,
        };
      }
    }
  }

  return {
    allowed: true,
    ...(price === null && {
      warning:
        "MARKET order: value-based safety limits cannot be enforced without a known price. Only quantity limits applied.",
    }),
  };
}
