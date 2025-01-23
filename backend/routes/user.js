import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = express.Router();
import { User } from "../db.js";
import z from "zod";
import authMiddleware from "../middleware.js";

const signUpSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const signInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/signup", async (req, res) => {
  const { username, password } = await signUpSchema.parse(req.body);

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    // Sign the token with the same secret key
    const token = jwt.sign({ username: newUser.username }, "12345", {
      expiresIn: "1h",
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({
      msg: "User created successfully",
      token,
      username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error creating user" });
  }
});

// Sign-in Route
router.post("/signin", async (req, res) => {
  const { username, password } = await signInSchema.parse(req.body);

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ msg: "Username and password are required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ msg: "User does not exist" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign({ username: user.username }, "12345", {
      expiresIn: "1h",
    });

    res.status(200).json({
      msg: "Sign-in successful",
      username,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

router.post("/add-todo", authMiddleware, async (req, res) => {
  const { username, description } = req.body;

  if (!username || !description) {
    return res
      .status(400)
      .json({ msg: "Please provide a username and task description" });
  }

  try {
    // Find the user and push the new task into the tasks array
    const user = await User.findOneAndUpdate(
      { username }, // Match the user by username
      { $push: { tasks: { description } } }, // Add the new task to the tasks array
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Task added successfully",
      tasks: user.tasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error adding task" });
  }
});

// Route to fetch all todos for the user
router.get("/todos", authMiddleware, async (req, res) => {
  try {
    const username = req.username; // Get the username from the middleware

    // Query the database using the username
    const user = await User.findOne({ username: username }); // Find the user by username

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json({
      msg: "Todos retrieved successfully",
      todos: user.tasks, // Send the todos array
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const { description } = req.body; // The description of the todo to delete

    if (!description) {
      return res.status(400).json({ msg: "Todo description is required" });
    }

    // Find the user by username and update their todos array
    const user = await User.findOneAndUpdate(
      { username: req.username },
      { $pull: { tasks: { description } } }, // Remove the todo by its description
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res
      .status(200)
      .json({ msg: "Todo deleted successfully", todos: user.todos });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
