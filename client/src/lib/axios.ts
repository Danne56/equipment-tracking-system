import axios from 'axios'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

export const axiosInstance = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Type-safe wrapper functions
export const api = {
  get: async <T = any>(url: string): Promise<T> => {
    return axiosInstance.get(url)
  },
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    return axiosInstance.post(url, data)
  },
  put: async <T = any>(url: string, data?: any): Promise<T> => {
    return axiosInstance.put(url, data)
  },
  delete: async <T = any>(url: string): Promise<T> => {
    return axiosInstance.delete(url)
  }
}
