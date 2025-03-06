import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://chat-server-h4qa.onrender.com/api",
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});
