import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Notification,
  NOTIFICATION_TYPE_ERROR,
  NOTIFICATION_TYPE_INFO,
  NOTIFICATION_TYPE_SUCCESS,
} from '../components/notifiction/notifiction';

interface ShowErrorMessage {
  hideSuccessMessage?: boolean;
  hideErrorMessage?: boolean;
  errorMessage?: string;
  successMessage?: string;
  errorCodes?: Array<number>;
}

interface RequestInterface {
  config: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
}

interface GetRequestInterface {
  url: string;
  config?: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
}

interface IAPIOptions {
  url: string;
  config?: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
  data?: any;
  method?: string;
}

interface PostRequestInterface {
  url: string;
  data?: any;
  config?: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
}

interface PutRequestInterface {
  url: string;
  data?: any;
  config?: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
}

interface DeleteRequestInterface {
  url: string;
  data?: any;  // Added data parameter
  config?: AxiosRequestConfig;
  messageSettings?: ShowErrorMessage;
}

enum StatusCode {
  NoContent = 204,
  InvalidRequest = 400,
  ResourceUnauthorized = 401,
  ClientForbidden = 403,
  ResourceNotFound = 404,
  Conflict = 409,
  BadGateway = 502,
  ServiceUnavailable = 503,
}

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

const defaultSettings: ShowErrorMessage = {
  hideSuccessMessage: false,
  hideErrorMessage: false,
  errorMessage: '',
  successMessage: '',
};

const API_BASE_URL =
  process.env.REACT_APP_API_BASIC_URL?.trim() ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:4001/api'
    : '/api');

const Http = async (apiDataProps: IAPIOptions) => {
  const http = axios.create({
    baseURL: API_BASE_URL,
    headers,
    withCredentials: true,
  });

  const {
    url: apiUrl,
    config: apiConfig = {},
    messageSettings,
    data: apiData,
    method = 'get',
  } = apiDataProps;

  // Prepare final config with data for all methods except GET
  const finalConfig: AxiosRequestConfig = {
    ...apiConfig,
    ...(apiData && method !== 'get' && { data: apiData })
  };

  const handleSuccess = (response: AxiosResponse<any, any>) => {
    if (messageSettings && !messageSettings.hideSuccessMessage) {
      if (messageSettings.successMessage && messageSettings.successMessage !== '') {
        Notification({
          type: NOTIFICATION_TYPE_SUCCESS,
          message: messageSettings.successMessage,
        });
      } else if (response?.data?.meta?.message) {
        Notification({
          type: NOTIFICATION_TYPE_SUCCESS,
          message: response?.data?.meta?.message,
        });
      } else if (response?.status === StatusCode.NoContent) {
        Notification({
          type: NOTIFICATION_TYPE_INFO,
          message: 'Nothing Updated.',
        });
      }
    }
  };

  const handleError = async (error: any) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (status === 401 && !messageSettings?.hideErrorMessage) {
      window.location.href = '/auth/login';
      return;
    }
    
    if (messageSettings && !messageSettings.hideErrorMessage) {
      if (messageSettings.errorMessage && messageSettings.errorMessage !== '') {
        Notification({
          type: NOTIFICATION_TYPE_ERROR,
          message: messageSettings.errorMessage,
        });
      } else if (typeof data?.data === 'string') {
        Notification({
          type: NOTIFICATION_TYPE_ERROR,
          message: data.data,
        });
      } else {
        switch (status) {
          case StatusCode.ResourceNotFound:
            Notification({
              type: NOTIFICATION_TYPE_ERROR,
              message: 'Resource Not Found.',
            });
            break;
          case StatusCode.ResourceUnauthorized:
            Notification({
              type: NOTIFICATION_TYPE_ERROR,
              message: 'Unauthorized Access.',
            });
            break;
          case StatusCode.ClientForbidden:
            Notification({
              type: NOTIFICATION_TYPE_ERROR,
              message: 'Forbidden Access.',
            });
            break;
          case StatusCode.Conflict:
            Notification({
              type: NOTIFICATION_TYPE_ERROR,
              message: 'Conflict Error.',
            });
            break;
          default:
            Notification({
              type: NOTIFICATION_TYPE_ERROR,
              message: 'Something Went Wrong.',
            });
            break;
        }
      }
    }
    return Promise.reject(error);
  };

  http.interceptors.request.use((request) => {
    // You can add request interceptors here
    return request;
  });

  http.interceptors.response.use(
    (response) => {
      handleSuccess(response);
      return response.data;
    },
    (error) => handleError(error)
  );

  switch (method) {
    case 'get':
      return http.get(apiUrl, finalConfig);
    case 'post':
      return http.post(apiUrl, apiData, finalConfig);
    case 'put':
      return http.put(apiUrl, apiData, finalConfig);
    case 'patch':
      return http.patch(apiUrl, apiData, finalConfig);
    case 'delete':
      return http.delete(apiUrl, finalConfig); // Now supports data in config
    default:
      return http.request(finalConfig);
  }
};

Http.get = ({ url, config, messageSettings }: GetRequestInterface): any => {
  return Http({
    url,
    config,
    messageSettings: { ...defaultSettings, ...messageSettings },
    method: 'get',
  });
};

Http.post = ({
  url,
  data,
  config,
  messageSettings,
}: PostRequestInterface): any =>
  Http({
    url,
    data,
    config,
    messageSettings: { ...defaultSettings, ...messageSettings },
    method: 'post',
  });

Http.put = ({ url, data, config, messageSettings }: PutRequestInterface): any =>
  Http({
    url,
    data,
    config,
    messageSettings: { ...defaultSettings, ...messageSettings },
    method: 'put',
  });

Http.patch = ({
  url,
  data,
  config,
  messageSettings,
}: PostRequestInterface): any =>
  Http({
    url,
    data,
    config,
    messageSettings: { ...defaultSettings, ...messageSettings },
    method: 'patch',
  });

Http.delete = ({ 
  url, 
  data,  // Added data parameter
  config, 
  messageSettings 
}: DeleteRequestInterface): any =>
  Http({
    url,
    data,  // Pass data through
    config,
    messageSettings: { ...defaultSettings, ...messageSettings },
    method: 'delete',
  });

Http.request = ({ config }: RequestInterface): any =>
  Http({
    config,
    url: '',
  });

export default Http;