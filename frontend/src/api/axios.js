import axios from "axios";

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "https://hiremind-backend-hmvc.onrender.com/api";
  url = url.trim().replace(/\/+$/, "");

  // Fix any incomplete hostname without domain (e.g. hiremind-backend-hmvc or hiremind-backend)
  if (url.includes("hiremind-backend") && !url.includes(".onrender.com")) {
    url = "https://hiremind-backend-hmvc.onrender.com/api";
  } else {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    if (!url.endsWith("/api")) {
      url += "/api";
    }
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // sends the HTTP-only auth cookie
});

// Automatic handling of HTTP 401: bounce the user back to /login (except on the
// login/register calls themselves, where a 401 is just "wrong credentials").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
