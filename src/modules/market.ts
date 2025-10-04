import { HttpClient } from "../utils/http";
import { OrderBook } from "../types";

export class PublicClient {
  private httpClient: HttpClient;

  constructor(baseUrl: string) {
    this.httpClient = new HttpClient(baseUrl);
  }

  async getDepth(symbol: string, limit: number = 10): Promise<OrderBook> {
    const params = {
      symbol: symbol.toUpperCase(),
      limit,
    };

    return this.httpClient.get("/api/v1/depth", params);
  }

  /**
   * 获取服务器时间
   * @returns 服务器时间戳（毫秒）
   */
  async getServerTime(): Promise<{ serverTime: number }> {
    return this.httpClient.get("/api/v1/time");
  }
}
