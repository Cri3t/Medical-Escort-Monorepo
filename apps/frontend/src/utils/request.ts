import axios from 'axios'
import type { AxiosError } from 'axios'

interface ApiResponse<T = unknown> {
  code: number
  data: T
  message?: string
}

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
})

request.interceptors.response.use(
  (res) => {
    const body = res.data as ApiResponse

    if (body.code === 200) {
      return body.data as any
    }

    alert(body.message || '请求失败')
    return Promise.reject(body)
  },
  (error: AxiosError<ApiResponse>) => {
    const message = error.response?.data?.message || error.message || '网络请求失败'
    alert(message)
    return Promise.reject(error)
  },
)

export default request
