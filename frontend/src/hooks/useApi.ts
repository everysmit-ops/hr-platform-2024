import { useState, useCallback, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface ApiOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  errorMessage?: string;
  successMessage?: string;
  autoFetch?: boolean;
  initialData?: any;
}

export function useApi<T = any>(url?: string, options: ApiOptions = {}) {
  const {
    autoFetch = false,
    initialData = null,
    showSuccessMessage = false,
    showErrorMessage = true,
    errorMessage = 'Произошла ошибка при выполнении запроса',
    successMessage = 'Операция выполнена успешно'
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: initialData as T,
    loading: false,
    error: null,
    status: 'idle'
  });

  const execute = useCallback(async (
    promise: Promise<Response>,
    execOptions: ApiOptions = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null, status: 'loading' }));

    try {
      const response = await promise;
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.detail || errorData.message || response.statusText;
        } catch {
          errorText = response.statusText;
        }
        
        throw new Error(errorText || `HTTP error ${response.status}`);
      }

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setState({
        data: data as T,
        loading: false,
        error: null,
        status: 'success'
      });

      if (showSuccessMessage || execOptions.showSuccessMessage) {
        console.log('✅', execOptions.successMessage || successMessage);
      }

      return { success: true, data };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Неизвестная ошибка';
      
      setState({
        data: null,
        loading: false,
        error,
        status: 'error'
      });

      if (showErrorMessage || execOptions.showErrorMessage) {
        console.error('❌', execOptions.errorMessage || errorMessage, error);
      }

      return { success: false, error };
    }
  }, [showSuccessMessage, showErrorMessage, errorMessage, successMessage]);

  const fetchData = useCallback(async (overrideUrl?: string) => {
    if (!url && !overrideUrl) {
      throw new Error('URL is required');
    }
    
    const token = localStorage.getItem('token');
    const fetchUrl = overrideUrl || url;
    
    return execute(
      fetch(fetchUrl!, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })
    );
  }, [url, execute]);

  useEffect(() => {
    if (autoFetch && url) {
      fetchData();
    }
  }, [autoFetch, url, fetchData]);

  const reset = useCallback(() => {
    setState({
      data: initialData as T,
      loading: false,
      error: null,
      status: 'idle'
    });
  }, [initialData]);

  return {
    ...state,
    data: state.data as T,
    execute,
    fetchData,
    reset,
    refetch: fetchData,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
}

// Хук для получения данных с автоматической загрузкой (упрощенная версия)
export function useFetch<T = any>(url: string, options?: RequestInit & { autoFetch?: boolean; initialData?: T }) {
  const { autoFetch = true, initialData = null, ...fetchOptions } = options || {};
  const api = useApi<T>(url, { autoFetch, initialData });

  const fetchData = useCallback(async (overrideUrl?: string) => {
    const token = localStorage.getItem('token');
    const fetchUrl = overrideUrl || url;
    
    return api.execute(
      fetch(fetchUrl, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...fetchOptions.headers,
        },
      })
    );
  }, [url, api, fetchOptions]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    ...api,
    data: api.data as T,
    refetch: fetchData,
  };
}
