import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5000"
  : "https://chat-server-h4qa.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token found. User is not authenticated.");
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      console.log("✅ Auth check successful:", res.data);
      get().connectSocket();
    } catch (error) {
      console.error("❌ Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      toast.success("🎉 Account created successfully");
      console.log("✅ Signup successful:", res.data);
      get().connectSocket();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Signup failed. Please check console.";
      console.error("❌ Signup error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      toast.success("🔑 Logged in successfully");
      console.log("✅ Login successful:", res.data);
      get().connectSocket();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Login failed";
      console.error("❌ Login error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("token");
      toast.success("🚪 Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Logout failed";
      console.error("❌ Logout error:", errorMessage);
      toast.error(errorMessage);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("✅ Profile updated successfully");
      console.log("✅ Profile updated:", res.data);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || "Profile update failed";
      console.error("❌ Error in update profile:", errorMessage);
      toast.error(errorMessage);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    if (socket) {
      if (socket.connected) {
        console.log("⚡ Socket already connected.");
        return;
      }
      socket.disconnect();
    }

    console.log("🔌 Connecting socket...");
    const newSocket = io(BASE_URL, { query: { userId: authUser._id } });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
      set({ socket: newSocket });
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
      console.log("👥 Online users updated:", userIds);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      set({ socket: null, onlineUsers: [] });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log("🔌 Disconnecting socket...");
      socket.off("connect");
      socket.off("getOnlineUsers");
      socket.off("disconnect");
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));