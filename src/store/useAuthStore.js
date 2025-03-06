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
      toast.success("🎉 Account created successfully");
      console.log("✅ Signup successful:", res.data);
      get().connectSocket();
    } catch (error) {
      console.error("❌ Signup error:", error.response?.data || error.message);
      toast.error(error?.response?.data?.message || "Signup failed. Please check console.");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("🔑 Logged in successfully");
      console.log("✅ Login successful:", res.data);
      get().connectSocket();
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("🚪 Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("❌ Logout error:", error.response?.data || error.message);
      toast.error(error?.response?.data?.message || "Logout failed");
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
      console.error("❌ Error in update profile:", error.response?.data || error.message);
      toast.error(error?.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    if (socket && socket.connected) {
      console.log("⚡ Socket already connected.");
      return;
    }

    console.log("🔌 Connecting socket...");
    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
    });

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
    });

    newSocket.connect();
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
