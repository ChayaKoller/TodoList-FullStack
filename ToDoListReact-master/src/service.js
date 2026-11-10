
import axios from "axios";

// 1. הגדרת כתובת בסיס לכל בקשות Axios
axios.defaults.baseURL = "http://localhost:5199/api";
axios.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    const isAuthRequest =
      error.config?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthRequest) {
      sessionStorage.removeItem("token");

      window.dispatchEvent(new Event("auth-expired"));
    }

    return Promise.reject(error);
  }
);

// 2. Interceptor לטיפול בשגיאות בתשובות
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

export default {
  getTasks: async () => {
    const result = await axios.get("/items");
    return result.data;
  },

  addTask: async (name) => {
    const result = await axios.post("/items", {
      name: name,
      isComplete: false
    });

    return result.data;
  },

  setCompleted: async (id, isComplete) => {
    const current = await axios.get("/items");

    const item = current.data.find(item => item.id === id);

    if (!item) {
      throw new Error("Task not found");
    }

    await axios.put(`/items/${id}`, {
      name: item.name,
      isComplete: isComplete
    });

    return { ...item, isComplete };
  },

  deleteTask: async (id) => {
    await axios.delete(`/items/${id}`);
  }
};
