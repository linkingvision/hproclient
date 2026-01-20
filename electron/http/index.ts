import axiosOriginal, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Create axios instance for direct data response
const http = axiosOriginal.create({
    // You can set your custom configuration here
    // baseURL, timeout, etc.
});

// Export http instance
export default http;
