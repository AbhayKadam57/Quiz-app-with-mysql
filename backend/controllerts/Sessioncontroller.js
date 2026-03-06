import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const DAILY_ATTEMPT_LIMIT = 3;
let leaderboardColumnsEnsured = false;

const ensureLeaderboardColumns = async () => {
  if (leaderboardColumnsEnsured) return;

  const [bestTimeCol] = await db.query(
    `SHOW COLUMNS FROM leaderboard LIKE 'best_time_taken'`,
  );
  if (bestTimeCol.length === 0) {
    await db.query(
      `ALTER TABLE leaderboard ADD COLUMN best_time_taken INT DEFAULT 999999`,
    );
  }

  const [bestRecordedCol] = await db.query(
    `SHOW COLUMNS FROM leaderboard LIKE 'best_recorded_at'`,
  );
  if (bestRecordedCol.length === 0) {
    await db.query(
      `ALTER TABLE leaderboard ADD COLUMN best_recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    );
  }

  leaderboardColumnsEnsured = true;
};

const getCompletedAttemptCountToday = async (userId) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS attempts
     FROM quiz_sessions
     WHERE user_id = ?
       AND DATE(started_at) = CURDATE()
       AND status = 'completed'`,
    [userId],
  );

  return rows[0]?.attempts || 0;
};

const getActiveSessionToday = async (userId) => {
  const [rows] = await db.query(
    `SELECT id
     FROM quiz_sessions
     WHERE user_id = ?
       AND status = 'started'
       AND DATE(started_at) = CURDATE()
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
};

const getDailyLimitPayload = (attempts) => ({
  attemptsToday: attempts,
  attemptsRemaining: Math.max(0, DAILY_ATTEMPT_LIMIT - attempts),
  dailyLimit: DAILY_ATTEMPT_LIMIT,
});

export const startSession = async (req, res) => {
  const userId = req.user.userId;

  try {
    const activeToday = await getActiveSessionToday(userId);
    const completedToday = await getCompletedAttemptCountToday(userId);

    if (activeToday) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing session.",
        sessionId: activeToday.id,
        isResumed: true,
        ...getDailyLimitPayload(completedToday + 1),
      });
    }

    if (completedToday >= DAILY_ATTEMPT_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Daily quiz limit reached. You can play again tomorrow.",
        ...getDailyLimitPayload(completedToday),
      });
    }

    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO quiz_sessions (id, user_id, started_at, status) VALUES (?, ?, NOW(), 'started')`,
      [sessionId, userId],
    );

    res.status(201).json({
      success: true,
      message: "New IPL quiz attempt started!",
      sessionId,
      isResumed: false,
      ...getDailyLimitPayload(completedToday + 1),
    });
  } catch (err) {
    console.error("startSession Error:", err.message);
    res.status(500).json({ success: false, message: "Error starting session." });
  }
};

export const submitAnswer = async (req, res) => {
  const { sessionId, questionId, selectedOption, timeTaken } = req.body;
  const userId = req.user.userId;

  if (!sessionId || !questionId) {
    return res.status(400).json({
      success: false,
      message: "sessionId and questionId are required.",
    });
  }

  const normalizedOption =
    selectedOption && typeof selectedOption === "string"
      ? selectedOption.toUpperCase()
      : null;

  const validOptions = ["A", "B", "C", "D"];
  if (normalizedOption && !validOptions.includes(normalizedOption)) {
    return res.status(400).json({
      success: false,
      message: "selectedOption must be A, B, C, or D.",
    });
  }

  try {
    const [session] = await db.query(
      `SELECT * FROM quiz_sessions
       WHERE id = ? AND user_id = ? AND status = 'started'`,
      [sessionId, userId],
    );

    if (session.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session or session already completed.",
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM user_answers
       WHERE session_id = ? AND question_id = ?`,
      [sessionId, questionId],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This question has already been answered.",
      });
    }

    const [question] = await db.query(
      `SELECT correct_option, marks FROM questions WHERE id = ?`,
      [questionId],
    );

    if (question.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    const correctOption = question[0].correct_option;
    const isCorrect = normalizedOption !== null && correctOption === normalizedOption;
    const scoreEarned = isCorrect ? question[0].marks : 0;
    const timeSpent = Number(timeTaken) || 0;

    await db.query(
      `INSERT INTO user_answers
       (session_id, question_id, selected_option, is_correct, time_taken)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, questionId, normalizedOption, isCorrect, timeSpent],
    );

    await db.query(
      `UPDATE quiz_sessions
       SET total_score = total_score + ?,
           total_time_taken = total_time_taken + ?
       WHERE id = ?`,
      [scoreEarned, timeSpent, sessionId],
    );

    const [answered] = await db.query(
      `SELECT COUNT(*) AS count
       FROM user_answers
       WHERE session_id = ?`,
      [sessionId],
    );

    res.status(200).json({
      success: true,
      isCorrect,
      correctOption,
      scoreEarned,
      answeredCount: answered[0].count,
      message: "Answer submitted.",
    });
  } catch (err) {
    console.error("submitAnswer Error:", err);
    res.status(500).json({ success: false, message: "Error submitting answer." });
  }
};

export const completeSession = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.userId;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "sessionId is required." });
  }

  try {
    await ensureLeaderboardColumns();

    const [session] = await db.query(
      `SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?`,
      [sessionId, userId],
    );

    if (session.length === 0) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    if (session[0].status !== "started") {
      return res.status(400).json({
        success: false,
        message: "Session already completed.",
        totalScore: session[0].total_score,
      });
    }

    await db.query(
      `UPDATE quiz_sessions SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [sessionId],
    );

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

    const [userInfo] = await db.query(`SELECT name FROM users WHERE id = ?`, [userId]);
    const totalAnswered = result[0].total_answered || 0;
    const totalCorrect = result[0].total_correct || 0;
    const accuracy = totalAnswered > 0 ? Number(((totalCorrect / totalAnswered) * 100).toFixed(2)) : 0;
    const userName = userInfo[0]?.name?.trim() || "Anonymous";
    const totalTimeTaken = result[0].total_time_taken || 0;

    await db.query(
      `INSERT INTO leaderboard (user_id, name, total_score, total_attempts, accuracy, best_time_taken, best_recorded_at)
       VALUES (?, ?, ?, 1, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       total_attempts = total_attempts + 1,
       total_score = CASE
         WHEN VALUES(total_score) > total_score THEN VALUES(total_score)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) > accuracy THEN VALUES(total_score)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) = accuracy AND VALUES(best_time_taken) < best_time_taken THEN VALUES(total_score)
         ELSE total_score
       END,
       accuracy = CASE
         WHEN VALUES(total_score) > total_score THEN VALUES(accuracy)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) > accuracy THEN VALUES(accuracy)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) = accuracy AND VALUES(best_time_taken) < best_time_taken THEN VALUES(accuracy)
         ELSE accuracy
       END,
       best_time_taken = CASE
         WHEN VALUES(total_score) > total_score THEN VALUES(best_time_taken)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) > accuracy THEN VALUES(best_time_taken)
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) = accuracy AND VALUES(best_time_taken) < best_time_taken THEN VALUES(best_time_taken)
         ELSE best_time_taken
       END,
       best_recorded_at = CASE
         WHEN VALUES(total_score) > total_score THEN NOW()
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) > accuracy THEN NOW()
         WHEN VALUES(total_score) = total_score AND VALUES(accuracy) = accuracy AND VALUES(best_time_taken) < best_time_taken THEN NOW()
         ELSE best_recorded_at
       END`,
      [userId, userName, result[0].total_score, accuracy, totalTimeTaken],
    );

    const [myStanding] = await db.query(
      `SELECT user_id, total_score, accuracy, best_time_taken, best_recorded_at
       FROM leaderboard
       WHERE user_id = ?`,
      [userId],
    );

    const me = myStanding[0];
    const [rank] = await db.query(
      `SELECT COUNT(*) + 1 AS user_rank
       FROM leaderboard
       WHERE total_score > ?
          OR (total_score = ? AND accuracy > ?)
          OR (total_score = ? AND accuracy = ? AND best_time_taken < ?)
          OR (total_score = ? AND accuracy = ? AND best_time_taken = ? AND best_recorded_at < ?)
          OR (total_score = ? AND accuracy = ? AND best_time_taken = ? AND best_recorded_at = ? AND user_id < ?)`,
      [
        me.total_score,
        me.total_score,
        me.accuracy,
        me.total_score,
        me.accuracy,
        me.best_time_taken,
        me.total_score,
        me.accuracy,
        me.best_time_taken,
        me.best_recorded_at,
        me.total_score,
        me.accuracy,
        me.best_time_taken,
        me.best_recorded_at,
        me.user_id,
      ],
    );

    const completedToday = await getCompletedAttemptCountToday(userId);

    res.status(200).json({
      success: true,
      message: "Quiz completed!",
      result: {
        totalScore: result[0].total_score,
        totalTimeTaken: result[0].total_time_taken,
        totalAnswered: result[0].total_answered,
        totalCorrect: result[0].total_correct,
        totalQuestions: 10,
        rank: rank[0].user_rank,
      },
      ...getDailyLimitPayload(completedToday),
    });
  } catch (err) {
    console.error("completeSession Error:", err.message);
    res.status(500).json({ success: false, message: "Error completing session." });
  }
};

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
      return res.status(404).json({ success: false, message: "No quiz session found." });
    }

    const completedToday = await getCompletedAttemptCountToday(userId);
    const activeToday = await getActiveSessionToday(userId);
    const attemptsToday = completedToday + (activeToday ? 1 : 0);

    res.status(200).json({
      success: true,
      result: sessions[0],
      ...getDailyLimitPayload(attemptsToday),
    });
  } catch (err) {
    console.error("getMyResult Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching result." });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    await ensureLeaderboardColumns();

    const [rows] = await db.query(
      `SELECT user_id, name, total_score, total_attempts, accuracy, best_time_taken, best_recorded_at, updated_at
       FROM leaderboard
       ORDER BY total_score DESC, accuracy DESC, best_time_taken ASC, best_recorded_at ASC, user_id ASC
       LIMIT 20`,
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      leaderboard: rows,
    });
  } catch (err) {
    console.error("getLeaderboard Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching leaderboard." });
  }
};

export const retakeQuiz = async (req, res) => {
  const userId = req.user.userId;

  try {
    const activeToday = await getActiveSessionToday(userId);
    const completedToday = await getCompletedAttemptCountToday(userId);

    if (activeToday) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing session.",
        sessionId: activeToday.id,
        isResumed: true,
        ...getDailyLimitPayload(completedToday + 1),
      });
    }

    if (completedToday >= DAILY_ATTEMPT_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Daily quiz limit reached. You can play again tomorrow.",
        ...getDailyLimitPayload(completedToday),
      });
    }

    const sessionId = uuidv4();
    await db.query(
      `INSERT INTO quiz_sessions (id, user_id, started_at, status) VALUES (?, ?, NOW(), 'started')`,
      [sessionId, userId],
    );

    res.status(201).json({
      success: true,
      message: "New attempt started.",
      sessionId,
      isResumed: false,
      ...getDailyLimitPayload(completedToday + 1),
    });
  } catch (err) {
    console.error("retakeQuiz Error:", err.message);
    res.status(500).json({ success: false, message: "Error starting a new attempt." });
  }
};
