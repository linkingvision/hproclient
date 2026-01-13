import axiosOriginal, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useStore } from '../store';

// Create debounce function
function debounce<T extends (...args: any[]) => void>(fn: T, wait: number = 1000): T {
    let timeout: NodeJS.Timeout | null = null;

    return ((...args: Parameters<T>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            fn(...args);
        }, wait);
    }) as T;
}


// Debounced function to prevent repetitive loginoutmenu event firing
const debouncedLogout = debounce(() => {

}, 1000);

// Create axios instance for direct data response
const axiosData = axiosOriginal.create({
    // You can set your custom configuration here
    // baseURL, timeout, etc.
});

// http request interceptor
axiosData.interceptors.request.use(
    (config) => {
        const store = useStore();
        if (store.access_token) {
            config.headers.Authorization = `Bearer ${store.access_token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// http response interceptor
axiosData.interceptors.response.use(
    (response: AxiosResponse) => {
        // Only return response.data
        const store = useStore();
        response.headers.Authorization = `Bearer ${store.access_token}`;
        return response.data;
    },
    (error: AxiosError) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.log('return login page');
                    debouncedLogout();
            }
        }

        return Promise.reject(error.response?.data);
    }
);

// Export axiosData instance
export default axiosData;
