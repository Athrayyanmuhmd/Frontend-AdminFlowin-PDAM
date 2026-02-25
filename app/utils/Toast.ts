import { toast } from "react-toastify";

export const showToast = (
  message: string,
  status: number,
  position: any,
  theme: any
) => {
  toast[status >= 200 && status < 300 ? "success" : "error"](message, {
    position: position ? position : "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: theme ? theme : "light",
  });
};
