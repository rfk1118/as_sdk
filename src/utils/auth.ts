import * as crypto from "crypto";
import { PublicClient } from "../modules/market";

export class AsterAuth {
  private apiKey: string;
  private secretKey: string;
  private publicClient: PublicClient;

  constructor(apiKey: string, secretKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.publicClient = new PublicClient(baseUrl);
  }

  /**
   * 生成 HMAC SHA256 签名
   * @param query 查询字符串
   * @returns 签名
   */
  public generateSignature(query: string): string {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(query)
      .digest("hex");
  }

  /**
   * 获取 API Key
   * @returns API Key
   */
  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * 生成请求头
   * @returns 请求头对象
   */
  public generateHeaders(): Record<string, string> {
    return {
      "X-MBX-APIKEY": this.apiKey,
      "User-Agent": "Node.js HTTP Client",
    };
  }

  /**
   * 对参数进行签名 (遵循as.js的实现模式)
   * @param params 参数对象
   * @returns 包含签名的查询字符串
   */
  public async signParams(params: Record<string, any>): Promise<string> {
    // 按照as.js模式构建查询字符串
    let content = "";
    for (let key in params) {
      content = content + key + "=" + params[key] + "&";
    }
    // 添加recvWindow和timestamp，使用交易所服务器时间
    const response = await this.publicClient.getServerTime();
    content += "recvWindow=5000&timestamp=" + response.serverTime;

    // 生成签名
    const signature = this.generateSignature(content);

    return content + "&signature=" + signature;
  }

  /**
   * 对参数进行签名 (自定义recvWindow版本)
   * @param params 参数对象
   * @param recvWindow 接收窗口时间
   * @returns 包含签名的查询字符串
   */
  public async signParamsWithWindow(
    params: Record<string, any>,
    recvWindow: number = 5000
  ): Promise<string> {
    let content = "";
    for (let key in params) {
      content = content + key + "=" + params[key] + "&";
    }

    // 获取交易所服务器时间
    const response = await this.publicClient.getServerTime();
    content += "recvWindow=" + recvWindow + "&timestamp=" + response.serverTime;

    const signature = this.generateSignature(content);
    return content + "&signature=" + signature;
  }
}
