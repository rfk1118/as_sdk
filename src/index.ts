import * as dotenv from "dotenv";
import * as ccxt from "ccxt";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();

export { AsterSDK } from "./aster-sdk";
export * from "./types";
export { PublicClient } from "./modules/market";
export { SpotTradingClient } from "./modules/spot";
export { AsterAuth } from "./utils/auth";
export { HttpClient } from "./utils/http";

import { AsterSDK, OrderStatus } from "./aster-sdk";

// 交易配置参数
const TRADING_CONFIG = {
  // 交易对符号
  SYMBOL: "4USDT",
  BINANCE_FUTURE_SYMBOL: "4/USDT:USDT",

  // 订单簿深度
  LIMIT: 10,

  // 单次交易金额
  ONCE_AMOUNT: 1000,

  // 买入套利阈值 (Aster买入 -> Binance卖出)
  BUY_PROFIT_THRESHOLD: 1.01,

  // 卖出套利阈值 (Aster卖出 -> Binance买入)
  SELL_PROFIT_THRESHOLD: 0.996,

  // 循环延迟 (ms)
  LOOP_DELAY: 200,
};

// 测试主函数
async function main() {
  console.log("开始测试订单薄获取功能...\n");

  // 创建 SDK 实例 - 从环境变量读取配置
  const sdk = new AsterSDK({
    baseUrl: process.env.ASTER_BASE_URL || "https://sapi.asterdex.com",
    apiKey: process.env.ASTER_API_KEY,
    secretKey: process.env.ASTER_SECRET_KEY,
  });

  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
    options: {
      defaultType: "future", // 使用合约市场
    },
  });

  const { SYMBOL, LIMIT, ONCE_AMOUNT, BUY_PROFIT_THRESHOLD, SELL_PROFIT_THRESHOLD, LOOP_DELAY } = TRADING_CONFIG;

  while (true) {
    try {
      console.log("📊 正在获取订单簿数据...");
      const [binanceOrderBook, asterOrderBook] = await Promise.all([
        binance.fetchOrderBook(`${SYMBOL.replace("USDT", "/USDT")}`, LIMIT),
        sdk.market.getDepth(SYMBOL, LIMIT),
      ]);

      // 买入逻辑 (Aster买入 -> Binance卖出)
      await handleBuyArbitrage(
        sdk,
        binance,
        binanceOrderBook,
        asterOrderBook,
        SYMBOL,
        ONCE_AMOUNT,
        BUY_PROFIT_THRESHOLD
      );

      // 卖出逻辑 (Aster卖出 -> Binance买入)
      await handleSellArbitrage(
        sdk,
        binance,
        binanceOrderBook,
        asterOrderBook,
        SYMBOL,
        ONCE_AMOUNT,
        SELL_PROFIT_THRESHOLD
      );
    } catch (error) {
      console.error("❌ 程序执行出错:");
      logError(error);
    }

    // 每次循环完睡眠50ms
    await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY));
  }
}

function generateStrategyId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`.toUpperCase();
}

function logToFile(message: string): void {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `arbitrage_${new Date().toISOString().split('T')[0]}.txt`);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, "utf-8");
}

async function executeBinanceOrder(
  binance: any,
  side: "Buy" | "Sell",
  amount: number,
  strategyPrefix: string
): Promise<void> {
  await binance.createOrder(
    TRADING_CONFIG.BINANCE_FUTURE_SYMBOL,
    "market",
    side,
    amount,
    undefined,
    {
      newClientStrategyId: generateStrategyId(strategyPrefix),
    }
  );
}

async function handleBuyArbitrage(
  sdk: AsterSDK,
  binance: any,
  binanceOrderBook: any,
  asterOrderBook: any,
  symbol: string,
  amount: number,
  profitThreshold: number
): Promise<void> {
  try {
    const binancePrice = binanceOrderBook.bids[0]?.[0];
    const asterOrderPrice = Number(asterOrderBook.asks[0]?.[0]);

    if (!binancePrice || !asterOrderPrice) return;

    const profit = binancePrice / asterOrderPrice;
    console.log(`买入套利机会检查: ${profit.toFixed(6)}`);

    if (profit > profitThreshold) {
      const startTime = new Date();
      const opportunityLog = `📈 买入套利机会 [时间: ${startTime.toISOString()}, 收益率: ${profit.toFixed(6)}, Binance价格: ${binancePrice}, Aster价格: ${asterOrderPrice}]`;
      console.log(opportunityLog);
      logToFile(opportunityLog);
      const order = await sdk.spot?.marketBuy(symbol, amount.toString());
      const filledOrder = await sdk.spot?.queryOrder({
        orderId: order?.orderId,
        symbol,
      });

      console.log("Aster买单结果:", filledOrder);

      if (filledOrder?.status === OrderStatus.FILLED) {
        await executeBinanceOrder(binance, "Sell", amount, "AS_BUY");
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        console.log(`✅ 买入套利完成 [完成时间: ${endTime.toISOString()}, 耗时: ${duration}ms]`);
        await logAccountStatus(sdk, binance);
      }
    }
  } catch (error) {
    console.error("❌ 买入套利逻辑执行出错:");
    logError(error);
  }
}

async function handleSellArbitrage(
  sdk: AsterSDK,
  binance: any,
  binanceOrderBook: any,
  asterOrderBook: any,
  symbol: string,
  amount: number,
  profitThreshold: number
): Promise<void> {
  try {
    const binanceAskPrice = binanceOrderBook.asks[0]?.[0];
    const asterOrderBidPrice = Number(asterOrderBook.bids[0]?.[0]);

    if (!asterOrderBidPrice || !binanceAskPrice) return;

    const profit = asterOrderBidPrice / binanceAskPrice;
    console.log(`卖出套利机会检查: ${profit.toFixed(6)}`);

    if (profit > profitThreshold) {
      console.log("📈 执行卖出套利...");
      const order = await sdk.spot?.marketSell(symbol, amount.toString());
      const filledOrder = await sdk.spot?.queryOrder({
        orderId: order?.orderId,
        symbol,
      });

      console.log("Aster卖单结果:", filledOrder);

      if (filledOrder?.status === OrderStatus.FILLED) {
        await executeBinanceOrder(binance, "Buy", amount, "AS_SELL");
        console.log("✅ 卖出套利完成");
        // await logAccountStatus(sdk, binance);
      }
    }
  } catch (error) {
    console.error("❌ 卖出套利逻辑执行出错:");
    logError(error);
  }
}

function logError(error: unknown): void {
  console.error(error);
  if (error instanceof Error) {
    console.error("错误消息:", error.message);
    if (error.stack) {
      console.error("堆栈信息:", error.stack);
    }
  }
}

async function logAccountStatus(sdk: AsterSDK, binance: any): Promise<void> {
  const tokenSymbol = TRADING_CONFIG.SYMBOL.replace("USDT", "");
  const accountInfo = await sdk.spot?.getBalance(tokenSymbol);
  console.log("Aster账户信息:", accountInfo);

  const positions = await binance.fetchPositions([TRADING_CONFIG.BINANCE_FUTURE_SYMBOL]);
  console.log("Binance持仓信息:", positions[0].info);
}

// 导出主函数
export { main };

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
