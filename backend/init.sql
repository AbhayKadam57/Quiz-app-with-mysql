USE quiz_campaign;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  mobile VARCHAR(15) UNIQUE,
  otp VARCHAR(6),
  otp_expires_at DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT DEFAULT 1,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255),
  option_b VARCHAR(255),
  option_c VARCHAR(255),
  option_d VARCHAR(255),
  correct_option ENUM('A','B','C','D') NOT NULL,
  marks INT DEFAULT 10,
  order_no INT
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  started_at DATETIME,
  completed_at DATETIME,
  total_score INT DEFAULT 0,
  total_time_taken INT DEFAULT 0,
  status ENUM('started','completed','abandoned') DEFAULT 'started',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36),
  question_id INT,
  selected_option ENUM('A','B','C','D') DEFAULT NULL,
  is_correct BOOLEAN,
  time_taken INT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES quiz_sessions(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100),
  total_score INT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  best_time_taken INT DEFAULT 999999,
  best_recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user (user_id)
);

ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS best_time_taken INT DEFAULT 999999;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS best_recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, marks, order_no) VALUES
('Which team won the inaugural IPL season in 2008?', 'Chennai Super Kings', 'Rajasthan Royals', 'Mumbai Indians', 'Kolkata Knight Riders', 'B', 10, 1),
('Who is widely known as "Captain Cool" in IPL history?', 'Rohit Sharma', 'MS Dhoni', 'Virat Kohli', 'Shikhar Dhawan', 'B', 10, 2),
('Which IPL franchise has won the most titles?', 'Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'A', 10, 3),
('Who scored the first century in IPL history?', 'Brendon McCullum', 'Chris Gayle', 'AB de Villiers', 'Virender Sehwag', 'A', 10, 4),
('What is the home ground of Chennai Super Kings?', 'Wankhede Stadium', 'M. A. Chidambaram Stadium', 'Eden Gardens', 'Arun Jaitley Stadium', 'B', 10, 5),
('Which bowler holds one of the best IPL economy reputations as a spinner for KKR?', 'Sunil Narine', 'Yuzvendra Chahal', 'Rashid Khan', 'Ravichandran Ashwin', 'A', 10, 6),
('Which award is given to the highest run-scorer in an IPL season?', 'Purple Cap', 'Orange Cap', 'Fair Play Award', 'Most Valuable Player', 'B', 10, 7),
('Which player is known as "Mr. IPL" for his consistency?', 'Suresh Raina', 'KL Rahul', 'David Warner', 'Faf du Plessis', 'A', 10, 8),
('Which city is home to the Royal Challengers Bengaluru franchise?', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Jaipur', 'B', 10, 9),
('How many balls are in a legal over in IPL cricket?', '5', '6', '7', '8', 'B', 10, 10);
