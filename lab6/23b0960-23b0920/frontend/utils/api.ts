import API_URL from '../config';

interface ApiOptions extends RequestInit {
    timeout?: number;
    silent?: boolean;
    body?: any;
}

/**
 * Utility function to make API calls.
 * Wraps the native fetch API to provide:
 * 1. Base URL handling (interprets relative paths).
 * 2. Automatic JSON parsing for requests and responses.
 * 3. Timeout handling (defaults to 15 seconds).
 * 4. Centralized error handling and normalization.
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/login').
 * @param {ApiOptions} options - Fetch options (method, body, headers, etc.).
 * @returns {Promise<any>} - The parsed JSON response.
 */
export const apiCall = async (endpoint: string, options: ApiOptions = {}): Promise<any> => {
    const { timeout = 15000, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const config: RequestInit = {
            ...fetchOptions,
            headers: {
                ...defaultHeaders,
                ...fetchOptions.headers,
            },
            credentials: 'include',
            signal: controller.signal,
        };

        if (options.body && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);
        clearTimeout(id);

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Something went wrong') as Error & { status?: number };
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (error: any) {
        clearTimeout(id);
        console.error(`API Error (${endpoint}):`, error);

        if (options.silent) {
            throw error;
        }

        let message = error.message || 'Something went wrong. Please check your internet connection.';

        if (error.name === 'AbortError') {
            message = 'Request timed out. Please check your internet connection and server status.';
        } else if (error.message && error.message.includes('Network request failed')) {
            message = 'Network error. Please check your internet connection and ensure the server is running.';
        }

        throw error;
    }
};
