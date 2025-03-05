import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL: "https://chat-server-h4qa.onrender.com/api",
  baseURL: "https://chat-server-h4qa.onrender.com",
  
  withCredentials: true,
});
