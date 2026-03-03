// const db = require('../config/db');
// const { v4: uuidv4 } = require('uuid');
import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────
// POST /api/session/start  (Protected)
// Starts a new quiz session for the user
// ─────────────────────────────────────────────
export const startSession = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Check if user already has an active session
    const [active] = await db.query(
      `SELECT id FROM quiz_sessions WHERE user_id = ? AND status = 'started'`,
      [userId],
    );

    if (active.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing session.",
        sessionId: active[0].id,
        isResumed: true,
      });
    }

    // Check if user already completed the quiz
    const [completed] = await db.query(
      `SELECT id, total_score FROM quiz_sessions WHERE user_id = ? AND status = 'completed'`,
      [userId],
    );

    if (completed.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already completed this quiz.",
        totalScore: completed[0].total_score,
      });
    }

    // Create new session
    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO quiz_sessions (id, user_id, started_at, status) VALUES (?, ?, NOW(), 'started')`,
      [sessionId, userId],
    );

    res.status(201).json({
      success: true,
      message: "Quiz session started!",
      sessionId,
      isResumed: false,
    });
  } catch (err) {
    console.error("startSession Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error starting session." });
  }
};

// ─────────────────────────────────────────────
// POST /api/session/answer  (Protected)
// Submit answer for a single question
// Body: { sessionId, questionId, selectedOption, timeTaken }
// ─────────────────────────────────────────────
export const submitAnswer = async (req, res) => {
  const { sessionId, questionId, selectedOption, timeTaken } = req.body;
  const userId = req.user.userId;

  // Validate required fields
  if (!sessionId || !questionId) {
    return res.status(400).json({
      success: false,
      message: "sessionId and questionId are required.",
    });
  }

  // Normalize option safely
  const normalizedOption =
    selectedOption && typeof selectedOption === "string"
      ? selectedOption.toUpperCase()
      : null;

  const validOptions = ["A", "B", "C", "D"];

  // Validate only if option exists
  if (normalizedOption && !validOptions.includes(normalizedOption)) {
    return res.status(400).json({
      success: false,
      message: "selectedOption must be A, B, C, or D.",
    });
  }

  try {
    // Validate session
    const [session] = await db.query(
      `SELECT * FROM quiz_sessions 
       WHERE id = ? AND user_id = ? AND status = 'started'`,
      [sessionId, userId]
    );

    if (session.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session or session already completed.",
      });
    }

    // Prevent double answer
    const [existing] = await db.query(
      `SELECT id FROM user_answers 
       WHERE session_id = ? AND question_id = ?`,
      [sessionId, questionId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This question has already been answered.",
      });
    }

    // Get question
    const [question] = await db.query(
      `SELECT correct_option, marks FROM questions WHERE id = ?`,
      [questionId]
    );

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const correctOption = question[0].correct_option;

    // Determine correctness
    const isCorrect =
      normalizedOption !== null && correctOption === normalizedOption;

    const scoreEarned = isCorrect ? question[0].marks : 0;
    const timeSpent = Number(timeTaken) || 0;

    // Save answer
    await db.query(
      `INSERT INTO user_answers 
       (session_id, question_id, selected_option, is_correct, time_taken)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sessionId,
        questionId,
        normalizedOption, // safe value
        isCorrect,
        timeSpent,
      ]
    );

    // Update session totals
    await db.query(
      `UPDATE quiz_sessions
       SET total_score = total_score + ?, 
           total_time_taken = total_time_taken + ?
       WHERE id = ?`,
      [scoreEarned, timeSpent, sessionId]
    );

    // Count answered questions
    const [answered] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM user_answers 
       WHERE session_id = ?`,
      [sessionId]
    );

    res.status(200).json({
      success: true,
      isCorrect,
      correctOption,
      scoreEarned,
      answeredCount: answered[0].count,
      message:
        normalizedOption === null
          ? "⏰ Time's up! Marked as wrong."
          : isCorrect
          ? "✅ Correct!"
          : "❌ Wrong answer!",
    });
  } catch (err) {
    console.error("submitAnswer Error:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting answer.",
    });
  }
};

// ─────────────────────────────────────────────
// POST /api/session/complete  (Protected)
// Mark quiz as completed and get final score
// Body: { sessionId }
// ─────────────────────────────────────────────
export const completeSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.userId;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }

  try {
    // Validate session
    const [session] = await db.query(
      `SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId],
    );

    if (session.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found." });
    }

    if (session[0].status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Session already completed.",
        totalScore: session[0].total_score,
      });
    }

    // Mark as completed
    await db.query(
      `UPDATE quiz_sessions SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [sessionId],
    );

    // Get final result
    const [result] = await db.query(
      `SELECT qs.total_score, qs.total_time_taken,
              COUNT(ua.id) AS total_answered,
              SUM(ua.is_correct) AS total_correct
       FROM quiz_sessions qs
       LEFT JOIN user_answers ua ON ua.session_id = qs.id
       WHERE qs.id = ?
       GROUP BY qs.id`,
      [sessionId],
    );

    // Get user info
    const [userInfo] = await db.query(`SELECT name FROM users WHERE id = ?`, [
      userId,
    ]);

    // Calculate accuracy
    const totalAnswered = result[0].total_answered || 0;
    const totalCorrect = result[0].total_correct || 0;
    const accuracy =
      totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(2) : 0;

    const userName = userInfo[0]?.name?.trim() || "Anonymous";

    // Update or insert leaderboard
    await db.query(
      `INSERT INTO leaderboard (user_id, name, total_score, total_attempts, accuracy)
       VALUES (?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
       name = ?,
       total_score = ?,
       total_attempts = total_attempts + 1,
       accuracy = ?`,
      [
        userId,
        userName,
        result[0].total_score,
        accuracy,
        userName,
        result[0].total_score,
        accuracy,
      ],
    );

    // Get user rank from leaderboard
    const [rank] = await db.query(
      `SELECT COUNT(*) + 1 AS user_rank
       FROM quiz_sessions
       WHERE status = 'completed'
         AND (total_score > ? OR (total_score = ? AND total_time_taken < ?))`,
      [
        result[0].total_score,
        result[0].total_score,
        result[0].total_time_taken,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Quiz completed! 🎉",
      result: {
        totalScore: result[0].total_score,
        totalTimeTaken: result[0].total_time_taken,
        totalAnswered: result[0].total_answered,
        totalCorrect: result[0].total_correct,
        totalQuestions: 10,
        rank: rank[0].user_rank,
      },
    });
  } catch (err) {
    console.error("completeSession Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error completing session." });
  }
};

// ─────────────────────────────────────────────
// GET /api/session/my-result  (Protected)
// Get the logged-in user's result
// ─────────────────────────────────────────────
export const getMyResult = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [sessions] = await db.query(
      `SELECT qs.*, COUNT(ua.id) AS total_answered, SUM(ua.is_correct) AS total_correct
       FROM quiz_sessions qs
       LEFT JOIN user_answers ua ON ua.session_id = qs.id
       WHERE qs.user_id = ?
       GROUP BY qs.id
       ORDER BY qs.started_at DESC
       LIMIT 1`,
      [userId],
    );

    if (sessions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No quiz session found." });
    }

    res.status(200).json({ success: true, result: sessions[0] });
  } catch (err) {
    console.error("getMyResult Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching result." });
  }
};

// ─────────────────────────────────────────────
// GET /api/session/leaderboard  (Protected)
// Top 20 scorers
// ─────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM leaderboard ORDER BY total_score DESC, accuracy DESC LIMIT 20`,
    );

    console.log("leaderboard rows", rows);

    res.status(200).json({
      success: true,
      total: rows.length,
      leaderboard: rows,
    });
  } catch (err) {
    console.error("getLeaderboard Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching leaderboard." });
  }
};

// ─────────────────────────────────────────────
// POST /api/session/retake  (Protected)
// Delete old sessions/answers and start a fresh session
// ─────────────────────────────────────────────
export const retakeQuiz = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Delete all user_answers tied to this user's sessions
    await db.query(
      `DELETE ua FROM user_answers ua
       INNER JOIN quiz_sessions qs ON ua.session_id = qs.id
       WHERE qs.user_id = ?`,
      [userId],
    );

    // Delete all quiz sessions for this user
    await db.query(`DELETE FROM quiz_sessions WHERE user_id = ?`, [userId]);

    // Create a fresh session
    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO quiz_sessions (id, user_id, started_at, status) VALUES (?, ?, NOW(), 'started')`,
      [sessionId, userId],
    );

    res.status(201).json({
      success: true,
      message: "Quiz session reset! Good luck! 🎉",
      sessionId,
    });
  } catch (err) {
    console.error("retakeQuiz Error:", err.message);
    res.status(500).json({ success: false, message: "Error retaking quiz." });
  }
};
