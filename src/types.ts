export interface AngelOneResponse<T = unknown> {
  status: boolean;
  message: string;
  errorcode: string;
  data: T | null;
}

export interface LoginData {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
}

export interface ProfileData {
  clientcode: string;
  name: string;
  email: string;
  mobileno: string;
  exchanges: string[];
  products: string[];
  broker: string;
}

export interface HoldingItem {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  t1quantity: number;
  realisedquantity: number;
  quantity: number;
  authorisedquantity: number;
  product: string;
  collateralquantity: number;
  collateraltype: string;
  haircut: number;
  averageprice: number;
  ltp: number;
  symboltoken: string;
  close: number;
  profitandloss: number;
  pnlpercentage: number;
}

export interface PositionItem {
  tradingsymbol: string;
  symboltoken: string;
  exchange: string;
  producttype: string;
  buyqty: number;
  sellqty: number;
  netqty: number;
  buyavgprice: number;
  sellavgprice: number;
  ltp: number;
  unrealised: number;
  realised: number;
  pnl: number;
}

export interface OrderItem {
  orderid: string;
  tradingsymbol: string;
  symboltoken: string;
  exchange: string;
  transactiontype: string;
  producttype: string;
  ordertype: string;
  variety: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: number;
  filledshares: number;
  unfilledshares: number;
  status: string;
  text: string;
  ordertag: string;
  updatetime: string;
}

export interface TradeItem {
  orderid: string;
  tradingsymbol: string;
  exchange: string;
  transactiontype: string;
  producttype: string;
  fillprice: number;
  fillsize: number;
  filltime: string;
}

export interface LtpData {
  exchange: string;
  tradingsymbol: string;
  symboltoken: string;
  open: number;
  high: number;
  low: number;
  close: number;
  ltp: number;
}

export interface SearchScripItem {
  exchange: string;
  tradingsymbol: string;
  symboltoken: string;
}

export type CandleData = [string, number, number, number, number, number][];

export interface PlaceOrderData {
  orderid: string;
}

export interface RMSData {
  net: string;
  availablecash: string;
  availableintradaypayin: string;
  availablelimitmargin: string;
  collateral: string;
  m2munrealized: string;
  m2mrealized: string;
  utiliseddebits: string;
  utilisedspan: string;
  utilisedoptionpremium: string;
  utilisedholdingtrades: string;
  utilisedexposure: string;
  utilisedturnover: string;
  utilisedpayout: string;
}

export interface PlaceOrderParams {
  variety: string;
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: string;
  exchange: string;
  ordertype: string;
  producttype: string;
  duration: string;
  quantity: string;
  price?: string;
  squareoff?: string;
  stoploss?: string;
  triggerprice?: string;
}

export interface ModifyOrderParams {
  variety: string;
  orderid: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: string;
  quantity: string;
  tradingsymbol: string;
  symboltoken: string;
  exchange: string;
  triggerprice?: string;
}

export interface CancelOrderParams {
  variety: string;
  orderid: string;
}

export interface CreateGttRuleParams {
  tradingsymbol: string;
  symboltoken: string;
  exchange: string;
  producttype: string;
  transactiontype: string;
  price: string;
  qty: string;
  disclosedqty: string;
  triggerprice: string;
  timeperiod: string;
}

export interface ModifyGttRuleParams extends CreateGttRuleParams {
  id: string;
}

export interface CancelGttRuleParams {
  id: string;
  symboltoken: string;
  exchange: string;
}

export interface ConvertPositionParams {
  exchange: string;
  symboltoken: string;
  tradingsymbol: string;
  oldproducttype: string;
  newproducttype: string;
  transactiontype: string;
  quantity: string;
  type: string;
}

export class AngelOneError extends Error {
  constructor(
    message: string,
    public errorcode: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AngelOneError";
  }
}
