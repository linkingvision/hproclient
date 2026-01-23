import axiosOriginal, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import https from 'https'

// Create axios instance for direct data response
const http = axiosOriginal.create({
    // You can set your custom configuration here
    // baseURL, timeout, etc.
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    })
});

// Export http instance
export default http;
