import db from "../config/db.js";

const QUIZ_SIZE = 10;

export const getQuestions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [freshPool] = await db.query(
      `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.marks, q.order_no
       FROM questions q
       WHERE q.id NOT IN (
         SELECT ua.question_id
         FROM user_answers ua
         INNER JOIN quiz_sessions qs ON qs.id = ua.session_id
         WHERE qs.user_id = ?
           AND DATE(qs.started_at) = CURDATE()
       )
       ORDER BY RAND()
       LIMIT ?`,
      [userId, QUIZ_SIZE],
    );

    let questions = freshPool;

    if (questions.length < QUIZ_SIZE) {
      const needed = QUIZ_SIZE - questions.length;
      const takenIds = questions.map((q) => q.id);

      const [fallbackPool] = await db.query(
        `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.marks, q.order_no
         FROM questions q
         ${takenIds.length ? `WHERE q.id NOT IN (${takenIds.map(() => "?").join(",")})` : ""}
         ORDER BY RAND()
         LIMIT ?`,
        takenIds.length ? [...takenIds, needed] : [needed],
      );

      questions = [...questions, ...fallbackPool];
    }

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: "No questions found." });
    }

    const formatted = questions.map((q, idx) => ({
      id: q.id,
      question: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      marks: q.marks,
      order: idx + 1,
    }));

    res.status(200).json({
      success: true,
      total: formatted.length,
      questions: formatted,
    });
  } catch (err) {
    console.error("getQuestions Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching questions." });
  }
};
