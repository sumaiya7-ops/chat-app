import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token:
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null,
  },
});

export default socket;