import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import feeStructureRoutes from "./routes/feeStructureRoutes.js";
import studentDiscountRoutes from "./routes/studentDiscountRoutes.js";
import PaperFundRoutes from "./routes/paperFundRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import examRoutes from "./routes/examRoutes.js";

dotenv.config();
const FRONTEND = process.env.FRONTEND;
const PORT = process.env.PORT;
const DB_URL = process.env.DB_URL;
const app = express();
const server = http.createServer(app);

// Add these to your .env or define them here
const allowedOrigins = [
  FRONTEND, // Your Vercel URL
  "http://falcon-academic-portal.com.pk", // New Domain (HTTP)
  "https://falcon-academic-portal.com.pk", // New Domain (HTTPS)
  "http://185.170.58.165", // Your VPS IP
  "http://185.170.58.165:5000", // Your API directly
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Check if origin is in our list or a Vercel preview
      if (
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(new URL(origin).hostname)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight requests
// app.options("*", cors());

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  session({
    secret: "12345",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: DB_URL,
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 360000000,
      sameSite: "lax",
    },
  })
);

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/fee-structures", feeStructureRoutes);
app.use("/api/student-discounts", studentDiscountRoutes);
app.use("/api/paperFund", PaperFundRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/exams", examRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Falcon Academic Portal API!");
});

// Start server with port fallback

server
  .listen(PORT)
  .on("listening", () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    mongoose
      .connect(DB_URL)
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((error) => {
        console.error(`Error connecting to MongoDB: ${error.message}`);
      });
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const fallbackPort = PORT + 1;
      console.warn(`Port ${PORT} is already in use. Trying ${fallbackPort}...`);

      server.listen(fallbackPort).on("listening", () => {
        console.log(
          `Fallback: Server is running on http://localhost:${fallbackPort}`
        );

        mongoose
          .connect(DB_URL)
          .then(() => {
            console.log("Connected to MongoDB");
          })
          .catch((error) => {
            console.error(`Error connecting to MongoDB: ${error.message}`);
          });
      });
    } else {
      throw err;
    }
  });
