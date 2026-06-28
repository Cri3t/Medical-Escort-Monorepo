import axios from "axios";
import type { AxiosError } from "axios";
import { translate } from "@/i18n";

interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

const request = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

request.interceptors.response.use(
  (res) => {
    const body = res.data as ApiResponse;

    if (body.code === 200) {
      return body.data as any;
    }

    alert(body.message || translate("request.failed"));
    return Promise.reject(body);
  },
  (error: AxiosError<ApiResponse>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      translate("request.networkFailed");
    alert(message);
    return Promise.reject(error);
  },
);

export default request;
