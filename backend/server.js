import { urlencoded } from "express"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { apiLimiter } from "./middleware/rateLimiter.js"
import authRoutes from "./routes/AuthRoutes.js"
import sessionRoutes from "./routes/sessionRoutes.js"
import quizRoutes from "./routes/Quizroutes.js"

dotenv.config()

const PORT = process.env.PORT || 8080;

const app = express()

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(apiLimiter)
// ─── Routes ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/session', sessionRoutes);


// ─── Health Check ────────────────────────────
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Quiz Campaign API is running!",
        version: "1.0.0",
        endpoints: {
            auth: '/api/auth',
            quiz: '/api/quiz',
            session: '/api/session',
        },
    })
})

// ─── 404 Handler ────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});


app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}\n`);
});