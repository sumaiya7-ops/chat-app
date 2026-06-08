import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { Server } from "socket.io";
import http from "http";
import Message from "./models/Message";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

/* MIDDLEWARE */
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

/* ROUTES */
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Chat API running 🚀");
});

const server = http.createServer(app);

/* SOCKET */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;

  let userId: string | null = null;

  try {
    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      userId = decoded.id;
    }
  } catch (err) {
    console.log("Invalid token");
  }

  console.log("User connected:", userId);

  /* JOIN ROOM */
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  /* SEND MESSAGE */
  socket.on("send_message", async (data) => {
    const { receiverId, text, roomId } = data;

    const message = await Message.create({
      senderId: userId,
      receiverId,
      text,
    });

    io.to(roomId).emit("receive_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });
});

/* CONNECT DB + START */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});