import axios, { AxiosInstance, AxiosResponse } from "axios";
import { AsterApiError } from "../types";

export class HttpClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.data) {
          // Check if response is HTML (server error page) vs JSON (API error)
          if (
            typeof error.response.data === "string" &&
            error.response.data.includes("<!DOCTYPE html>")
          ) {
            const fullUrl = `${error.config?.baseURL || ""}${
              error.config?.url || ""
            }`;
            throw new Error(
              `Server Error: ${error.response.status} ${error.response.statusText} from ${fullUrl} - Server returned HTML error page instead of JSON`
            );
          }

          const apiError: AsterApiError = error.response.data;
          const code = apiError.code ?? "UNKNOWN";
          const msg =
            apiError.msg ?? error.response.statusText ?? "Unknown error";

          // Include more context in the error message
          const fullUrl = `${error.config?.baseURL || ""}${
            error.config?.url || ""
          }`;
          throw new Error(
            `API Error ${code}: ${msg} (${error.response.status} from ${fullUrl})`
          );
        }

        // Handle network errors or other non-API errors
        if (error.code) {
          throw new Error(`Network Error ${error.code}: ${error.message}`);
        }

        throw new Error(`Request failed: ${error.message}`);
      }
    );
  }

  /**
   * GET 请求
   * @param endpoint 端点
   * @param params 查询参数
   * @param headers 请求头
   * @returns 响应数据
   */
  public async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.client.get(endpoint, {
      params,
      headers,
    });
    return response.data;
  }

  /**
   * POST 请求
   * @param endpoint 端点
   * @param data 请求体数据
   * @param headers 请求头
   * @returns 响应数据
   */
  public async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.client.post(endpoint, data, {
      headers,
    });
    return response.data;
  }
}

/**
 * 将对象转换为 URL 查询字符串
 * @param params 参数对象
 * @returns 查询字符串
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");
}
