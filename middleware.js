import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  if (req.path === "/signin" || req.path === "/signup") {
    return next();
  }
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, '12345'); // Ensure the same secret is used here
    req.username = decoded.username; // Add username to the request
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ msg: "Invalid token" });
  }
};


export default authMiddleware;