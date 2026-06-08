import { Request, Response } from "express";
import Message from "../models/Message";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get messages",
    });
  }
};