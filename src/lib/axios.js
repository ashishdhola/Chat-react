import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://172.19.3.48:5001/api",
  // baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  
  withCredentials: true,
});
