import { toast, ToastOptions } from 'react-toastify';

export const NOTIFICATION_TYPE_SUCCESS = 'success';
export const NOTIFICATION_TYPE_ERROR = 'error';
export const NOTIFICATION_TYPE_INFO = 'info';
export const NOTIFICATION_TYPE_WARNING = 'warning';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  options?: ToastOptions;
}

export const Notification = ({ type, message, options }: NotificationProps) => {
  const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  };

  switch (type) {
    case NOTIFICATION_TYPE_SUCCESS:
      return toast.success(message, defaultOptions);
    case NOTIFICATION_TYPE_ERROR:
      return toast.error(message, defaultOptions);
    case NOTIFICATION_TYPE_INFO:
      return toast.info(message, defaultOptions);
    case NOTIFICATION_TYPE_WARNING:
      return toast.warning(message, defaultOptions);
    default:
      return toast(message, defaultOptions);
  }
};

