import { PublicClient } from "./modules/market";
import { SpotTradingClient } from "./modules/spot";
import { AsterConfig } from "./types";

/**
 * Aster DEX SDK 主类
 */
export class AsterSDK {
  private config: AsterConfig;
  public market: PublicClient;
  public spot?: SpotTradingClient;

  constructor(config: AsterConfig = {}) {
    this.config = {
      baseUrl: "https://sapi.asterdex.com",
      recvWindow: 5000, // Increase to 10 seconds for better timestamp tolerance
      ...config,
    };

    // 初始化公共数据客户端（无需认证）
    this.market = new PublicClient(this.config.baseUrl!);

    // 初始化现货交易客户端（需要认证）
    if (this.config.apiKey && this.config.secretKey) {
      this.spot = new SpotTradingClient(
        this.config.baseUrl!,
        this.config.apiKey,
        this.config.secretKey,
        this.config.recvWindow
      );
    }
  }

  /**
   * 设置 API 密钥
   * @param apiKey API Key
   * @param secretKey Secret Key
   */
  setApiKeys(apiKey: string, secretKey: string): void {
    this.config.apiKey = apiKey;
    this.config.secretKey = secretKey;

    // 重新初始化现货交易客户端
    this.spot = new SpotTradingClient(
      this.config.baseUrl!,
      apiKey,
      secretKey,
      this.config.recvWindow
    );
  }

  /**
   * 获取当前配置
   * @returns 配置对象
   */
  getConfig(): AsterConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<AsterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 重新初始化客户端
    this.market = new PublicClient(this.config.baseUrl!);

    if (this.config.apiKey && this.config.secretKey) {
      this.spot = new SpotTradingClient(
        this.config.baseUrl!,
        this.config.apiKey,
        this.config.secretKey,
        this.config.recvWindow
      );
    }
  }

  /**
   * 检查是否已配置认证信息
   * @returns 是否已认证
   */
  isAuthenticated(): boolean {
    return !!(this.config.apiKey && this.config.secretKey);
  }
}

// 导出所有类型
export * from "./types";
export { PublicClient } from "./modules/market";
export { SpotTradingClient } from "./modules/spot";
export { AsterAuth } from "./utils/auth";
export { HttpClient } from "./utils/http";
