import express, { Request, Response } from "express";
import User from "../models/User";

const router = express.Router();

// GET all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");

    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);

    return res.status(500).json({
      message: "Error fetching users",
    });
  }
});

export default router;