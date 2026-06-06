import http from "./http";

export interface ApiCallOptions {
    url: string;
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    messageSettings?: {
        successMessage?: string;
        errorMessage?: string;
        hideSuccessMessage?: boolean;
        hideErrorMessage?: boolean;
        showErrorToast?: boolean;
        showSuccessToast?: boolean;
        showLoading?: boolean;
        loadingMessage?: string;
    };
    extraFilter?: any;
    responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
}

export const DynamicApiCall = ({
  url,
  method = "post",
  data,
  params,
  headers,
  messageSettings,
}: ApiCallOptions) => {
  const config: any = {
    url,
    method,
    params,
  };

  if (messageSettings) {
    config.messageSettings = messageSettings;
  }

    // Only add headers if provided
    if (headers) {
        config.config = headers;
    }

  // Attach data for all methods except GET
  if (data && method !== "get") {
    config.data = data;
  }

    console.log("http[method](config) : " , (config))
    return http[method](config);
};
