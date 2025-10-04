// Configuration
export interface AsterConfig {
  baseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  recvWindow?: number;
}

// Enums
export enum OrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderType {
  LIMIT = "LIMIT",
  MARKET = "MARKET",
  STOP = "STOP",
  TAKE_PROFIT = "TAKE_PROFIT",
  STOP_MARKET = "STOP_MARKET",
  TAKE_PROFIT_MARKET = "TAKE_PROFIT_MARKET",
}

export enum OrderStatus {
  NEW = "NEW",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FILLED = "FILLED",
  CANCELED = "CANCELED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum TimeInForce {
  GTC = "GTC",
  IOC = "IOC",
  FOK = "FOK",
  GTX = "GTX",
}

// Account
export interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export interface AccountInfo {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  canBurnAsset: boolean;
  updateTime: number;
  balances: Balance[];
}

// Order
export interface NewOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce?: TimeInForce;
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  newClientOrderId?: string;
  stopPrice?: string;
  recvWindow?: number;
}

export interface OrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  updateTime: number;
  price: string;
  avgPrice: string;
  origQty: string;
  cumQty: string;
  executedQty: string;
  cumQuote: string;
  status: OrderStatus;
  timeInForce: TimeInForce;
  stopPrice: string;
  origType: OrderType;
  type: OrderType;
  side: OrderSide;
}

export interface QueryOrderParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
  recvWindow?: number;
  timestamp?: number;
}

export interface OrderQuery {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
  recvWindow?: number;
}

export interface CancelOrderParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
  recvWindow?: number;
}

// Trade
export interface Trade {
  symbol: string;
  id: number;
  orderId: number;
  side: OrderSide;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  counterpartyId: number;
  createUpdateId: number | null;
  maker: boolean;
  buyer: boolean;
}

// Market Data
export interface DepthLevel {
  price: string;
  quantity: string;
}

export interface OrderBook {
  lastUpdateId: number;
  E: number; // 消息时间
  T: number; // 撮合引擎时间
  bids: [string, string][]; // [价格, 数量]
  asks: [string, string][];
}

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface Ticker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
  baseAsset: string;
  quoteAsset: string;
}

export interface PriceResponse {
  symbol: string;
  price: string;
  time: number;
}

export interface BookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
}

export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: RateLimit[];
  exchangeFilters: any[];
  assets: Asset[];
  symbols: SymbolInfo[];
}

export interface RateLimit {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
}

export interface Asset {
  asset: string;
}

export interface SymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  orderTypes: OrderType[];
  timeInForce: TimeInForce[];
  filters: Filter[];
  ocoAllowed: boolean;
}

export interface Filter {
  filterType: string;
  [key: string]: any;
}

// Error
export interface AsterApiError {
  code: number;
  msg: string;
}