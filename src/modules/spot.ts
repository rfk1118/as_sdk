import { HttpClient } from "../utils/http";
import { AsterAuth } from "../utils/auth";
import {
  AccountInfo,
  Balance,
  NewOrderParams,
  OrderResponse,
  OrderSide,
  OrderType,
  QueryOrderParams,
} from "../types";

export class SpotTradingClient {
  private httpClient: HttpClient;
  private auth: AsterAuth;
  private recvWindow: number;

  constructor(
    baseUrl: string,
    apiKey: string,
    secretKey: string,
    recvWindow: number = 5000 // Increase default recvWindow to 10 seconds
  ) {
    this.httpClient = new HttpClient(baseUrl);
    this.auth = new AsterAuth(apiKey, secretKey, baseUrl);
    this.recvWindow = recvWindow;
  }

  /**
   * 获取账户信息
   * @param recvWindow 接收窗口时间（可选）
   * @returns 账户信息
   */
  async getAccountInfo(recvWindow?: number): Promise<AccountInfo> {
    const params = {};
    const headers = this.auth.generateHeaders();

    const queryString = recvWindow
      ? await this.auth.signParamsWithWindow(params, recvWindow)
      : await this.auth.signParams(params);

    const url = `/api/v1/account?${queryString}`;

    try {
      const response = await this.httpClient.get<AccountInfo>(
        url,
        undefined,
        headers
      );
      return response;
    } catch (error: any) {
      if (error.message?.includes("Server returned HTML error page")) {
        throw new Error(
          `Authentication failed - likely timestamp synchronization issue. Original error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 下单
   * @param orderParams 下单参数
   * @returns 订单响应
   */
  async newOrder(orderParams: NewOrderParams): Promise<OrderResponse> {
    const params = {
      ...orderParams,
      symbol: orderParams.symbol.toUpperCase(),
    };

    // 移除 undefined 值
    Object.keys(params).forEach((key) => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });

    const headers = this.auth.generateHeaders();

    const recvWindow = orderParams.recvWindow || this.recvWindow;
    const queryString = await this.auth.signParamsWithWindow(
      params,
      recvWindow
    );

    // 遵循as.js模式：POST请求body包含完整查询字符串
    return this.httpClient.post("/api/v1/order", queryString, headers);
  }

  /**
   * 市价买单
   * @param symbol 交易对
   * @param quoteOrderQty 报价资产数量
   * @param newClientOrderId 客户自定义订单ID（可选）
   * @returns 订单响应
   */
  async marketBuy(symbol: string, quantity: string): Promise<OrderResponse> {
    return this.newOrder({
      symbol: symbol,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: quantity,
    });
  }

  /**
   * 市价卖单
   * @param symbol 交易对
   * @param quantity 数量
   * @param newClientOrderId 客户自定义订单ID（可选）
   * @returns 订单响应
   */
  async marketSell(symbol: string, quantity: string): Promise<OrderResponse> {
    return this.newOrder({
      symbol,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      quantity,
    });
  }

  /**
   * 根据符号查询余额
   * @param symbol 资产符号（如 'BTC', 'ETH', 'USDT' 等）
   * @param recvWindow 接收窗口时间（可选）
   * @returns 指定资产的余额信息，如果不存在则返回 null
   */
  async getBalance(
    symbol: string,
    recvWindow?: number
  ): Promise<Balance | null> {
    const accountInfo = await this.getAccountInfo(recvWindow);
    const balance = accountInfo.balances.find(
      (b) => b.asset.toLowerCase() === symbol.toLowerCase()
    );
    return balance || null;
  }

  /**
   * 查询订单
   * @param params 查询参数
   * @returns 订单响应
   */
  async queryOrder(params: QueryOrderParams): Promise<OrderResponse> {
    // 验证参数：必须提供orderId或origClientOrderId其中之一
    if (!params.orderId && !params.origClientOrderId) {
      throw new Error("Either orderId or origClientOrderId must be provided");
    }

    const queryParams = {
      symbol: params.symbol.toUpperCase(),
      ...(params.orderId && { orderId: params.orderId }),
      ...(params.origClientOrderId && {
        origClientOrderId: params.origClientOrderId,
      }),
    };

    const headers = this.auth.generateHeaders();

    const recvWindow = params.recvWindow || this.recvWindow;
    const queryString = await this.auth.signParamsWithWindow(
      queryParams,
      recvWindow
    );

    const url = `/api/v1/order?${queryString}`;

    try {
      const response = await this.httpClient.get<OrderResponse>(
        url,
        undefined,
        headers
      );
      return response;
    } catch (error: any) {
      if (error.message?.includes("Server returned HTML error page")) {
        throw new Error(
          `Authentication failed - likely timestamp synchronization issue. Original error: ${error.message}`
        );
      }
      throw error;
    }
  }
}
