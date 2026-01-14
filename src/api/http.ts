import axiosOriginal, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

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
const http = axiosOriginal.create({
    // You can set your custom configuration here
    // baseURL, timeout, etc.
});

// http request interceptor
http.interceptors.request.use(
    (config) => {
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// http response interceptor
http.interceptors.response.use(
    (response: AxiosResponse) => {
        // Only return response.data
        return response;
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

// Export http instance
export default http;
