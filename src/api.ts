import type { Config } from "@/config.js";
import { generateTOTP } from "@/totp.js";
import type {
  AngelOneResponse,
  CancelGttRuleParams,
  CancelOrderParams,
  ConvertPositionParams,
  CreateGttRuleParams,
  LoginData,
  ModifyGttRuleParams,
  ModifyOrderParams,
  PlaceOrderParams,
} from "@/types.js";
import { AngelOneError } from "@/types.js";

const BASE_URL = "https://apiconnect.angelone.in";

export class AngelOneAPI {
  private jwtToken: string | null = null;
  private refreshToken: string | null = null;
  private feedToken: string | null = null;
  private tokenExpiry: number = 0;
  private loginPromise: Promise<void> | null = null;

  constructor(private config: Config) {}

  private getHeaders(authenticated: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-ClientLocalIP": "127.0.0.1",
      "X-ClientPublicIP": "127.0.0.1",
      "X-MACAddress": "AA:AA:AA:AA:AA:AA",
      "X-PrivateKey": this.config.apiKey,
    };

    if (authenticated && this.jwtToken) {
      headers["Authorization"] = `Bearer ${this.jwtToken}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    authenticated: boolean = true,
  ): Promise<T | null> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = this.getHeaders(authenticated);

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      throw new AngelOneError(
        `HTTP ${response.status}: ${response.statusText} (non-JSON response)`,
        "HTTP_ERROR",
        response.status,
      );
    }

    const data = (await response.json()) as AngelOneResponse<T>;

    if (!data.status) {
      throw new AngelOneError(
        data.message || "API request failed",
        data.errorcode || "UNKNOWN",
        response.status,
      );
    }

    if (data.data === null || data.data === undefined) {
      return null;
    }

    return data.data;
  }

  async ensureAuthenticated(): Promise<void> {
    if (this.jwtToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return;
    }

    if (this.jwtToken && this.refreshToken && Date.now() < this.tokenExpiry) {
      try {
        await this.refreshTokens();
        return;
      } catch {
        // Refresh failed, fall through to full login
      }
    }

    await this.login();
  }

  async login(): Promise<void> {
    if (this.loginPromise) {
      await this.loginPromise;
      return;
    }

    this.loginPromise = (async () => {
      try {
        const totp = generateTOTP(this.config.totpSecret);
        const data = await this.request<LoginData>(
          "POST",
          "/rest/auth/angelbroking/user/v1/loginByPassword",
          {
            clientcode: this.config.clientId,
            password: this.config.password,
            totp,
          },
          false,
        );

        if (!data) {
          throw new AngelOneError("Login succeeded but returned no data", "LOGIN_NO_DATA", 200);
        }

        this.jwtToken = data.jwtToken;
        this.refreshToken = data.refreshToken;
        this.feedToken = data.feedToken;
        this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      } catch (error) {
        this.jwtToken = null;
        this.refreshToken = null;
        this.feedToken = null;
        this.tokenExpiry = 0;
        throw error;
      } finally {
        this.loginPromise = null;
      }
    })();

    await this.loginPromise;
  }

  async logout(): Promise<void> {
    if (this.jwtToken) {
      try {
        await this.request(
          "POST",
          "/rest/secure/angelbroking/user/v1/logout",
          {
            clientcode: this.config.clientId,
          },
          true,
        );
      } catch {
        // Best-effort — clear tokens regardless
      }
    }
    this.jwtToken = null;
    this.refreshToken = null;
    this.feedToken = null;
    this.tokenExpiry = 0;
  }

  private async refreshTokens(): Promise<void> {
    const data = await this.request<LoginData>(
      "POST",
      "/rest/auth/angelbroking/jwt/v1/generateTokens",
      { refreshToken: this.refreshToken },
      true,
    );
    if (!data) {
      throw new AngelOneError("Token refresh returned no data", "REFRESH_NO_DATA", 200);
    }
    this.jwtToken = data.jwtToken;
    this.refreshToken = data.refreshToken;
    this.feedToken = data.feedToken;
    this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
  }

  private async authenticatedRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T | null> {
    await this.ensureAuthenticated();
    try {
      return await this.request<T>(method, endpoint, body, true);
    } catch (error) {
      if (
        error instanceof AngelOneError &&
        (error.errorcode === "AG8001" || error.statusCode === 401)
      ) {
        this.jwtToken = null;
        await this.login();
        return await this.request<T>(method, endpoint, body, true);
      }
      throw error;
    }
  }

  // User
  async getProfile<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/user/v1/getProfile");
  }

  async getRMS<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/user/v1/getRMS");
  }

  // Portfolio
  async getHoldings<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/portfolio/v1/getHolding");
  }

  async getPositions<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/order/v1/getPosition");
  }

  // Orders
  async getOrderBook<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/order/v1/getOrderBook");
  }

  async getTradeBook<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>("GET", "/rest/secure/angelbroking/order/v1/getTradeBook");
  }

  async placeOrder<T>(params: PlaceOrderParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/placeOrder",
      params,
    );
  }

  async modifyOrder<T>(params: ModifyOrderParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/modifyOrder",
      params,
    );
  }

  async cancelOrder<T>(params: CancelOrderParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/cancelOrder",
      params,
    );
  }

  // Market Data
  async getLtpData<T>(params: {
    exchange: string;
    tradingsymbol: string;
    symboltoken: string;
  }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/getLtpData",
      params,
    );
  }

  async searchScrip<T>(params: { exchange: string; searchscrip: string }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/searchScrip",
      params,
    );
  }

  async getCandleData<T>(params: {
    exchange: string;
    symboltoken: string;
    interval: string;
    fromdate: string;
    todate: string;
  }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/historical/v1/getCandleData",
      params,
    );
  }

  async getMarketQuote<T>(params: {
    mode: string;
    exchangeTokens: Record<string, string[]>;
  }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/market/v1/quote",
      params,
    );
  }

  // GTT
  async createGttRule<T>(params: CreateGttRuleParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/gtt-service/rest/secure/angelbroking/gtt/v1/createRule",
      params,
    );
  }

  async modifyGttRule<T>(params: ModifyGttRuleParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/gtt-service/rest/secure/angelbroking/gtt/v1/modifyRule",
      params,
    );
  }

  async cancelGttRule<T>(params: CancelGttRuleParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/gtt-service/rest/secure/angelbroking/gtt/v1/cancelRule",
      params,
    );
  }

  async getGttRuleDetails<T>(params: { id: string }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/gtt/v1/ruleDetails",
      params,
    );
  }

  async getGttRuleList<T>(params: {
    status: string[];
    page: number;
    count: number;
  }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/gtt/v1/ruleList",
      params,
    );
  }

  // Extended Portfolio
  async getAllHoldings<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "GET",
      "/rest/secure/angelbroking/portfolio/v1/getAllHolding",
    );
  }

  async convertPosition<T>(params: ConvertPositionParams): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/order/v1/convertPosition",
      params,
    );
  }

  // Individual Order
  async getOrderDetails<T>(orderId: string): Promise<T | null> {
    if (!/^\d+$/.test(orderId)) {
      throw new AngelOneError("Invalid orderId: must contain only digits", "INVALID_PARAM", 400);
    }
    return this.authenticatedRequest<T>(
      "GET",
      `/rest/secure/angelbroking/order/v1/details/${orderId}`,
    );
  }

  // Market Analytics
  async getOIData<T>(params: {
    exchange: string;
    symboltoken: string;
    interval: string;
    fromdate: string;
    todate: string;
  }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/historical/v1/getOIData",
      params,
    );
  }

  async getOptionGreeks<T>(params: { name: string; expirydate: string }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/marketData/v1/optionGreek",
      params,
    );
  }

  async getGainersLosers<T>(params: { datatype: string; expirytype: string }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/marketData/v1/gainersLosers",
      params,
    );
  }

  async getPutCallRatio<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "GET",
      "/rest/secure/angelbroking/marketData/v1/putCallRatio",
    );
  }

  async getOIBuildup<T>(params: { expirytype: string; datatype: string }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/marketData/v1/OIBuildup",
      params,
    );
  }

  async getNseIntraday<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "GET",
      "/rest/secure/angelbroking/marketData/v1/nseIntraday",
    );
  }

  async getBseIntraday<T>(): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "GET",
      "/rest/secure/angelbroking/marketData/v1/bseIntraday",
    );
  }

  // Calculator
  async estimateMargin<T>(params: { positions: unknown[] }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/margin/v1/batch",
      params,
    );
  }

  async estimateCharges<T>(params: { orders: unknown[] }): Promise<T | null> {
    return this.authenticatedRequest<T>(
      "POST",
      "/rest/secure/angelbroking/brokerage/v1/estimateCharges",
      params,
    );
  }

  isAuthenticated(): boolean {
    return this.jwtToken !== null && Date.now() < this.tokenExpiry;
  }
}
