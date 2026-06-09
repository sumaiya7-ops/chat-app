import express, { Request, Response } from "express";
import { getMessages } from "../controllers/messageController";

const router = express.Router();

// GET all messages (or filtered by query)
router.get("/", async (req: Request, res: Response) => {
  try {
    return await getMessages(req, res);
  } catch (error) {
    console.error("Message route error:", error);

    return res.status(500).json({
      message: "Error fetching messages",
    });
  }
});

export default router;