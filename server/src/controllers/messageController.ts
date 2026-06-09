import { Request, Response } from "express";
import Message from "../models/Message";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { sender, receiver, roomId } = req.query;

    let filter: any = {};

    // 🔥 Room-based chat (BEST for IMO/Messenger style)
    if (roomId) {
      filter.roomId = roomId;
    }

    // 🔥 fallback: sender-receiver based chat
    if (sender && receiver && !roomId) {
      filter = {
        $or: [
          { senderId: sender, receiverId: receiver },
          { senderId: receiver, receiverId: sender },
        ],
      };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Failed to get messages",
    });
  }
};