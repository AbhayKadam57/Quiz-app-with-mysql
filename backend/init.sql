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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user (user_id)
);

INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_option, marks, order_no) VALUES
('What is the capital of France?', 'Berlin', 'Madrid', 'Paris', 'Rome', 'C', 10, 1),
('What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'None', 'A', 10, 2),
('What is the largest planet in our solar system?', 'Saturn', 'Jupiter', 'Neptune', 'Uranus', 'B', 10, 3),
('Who wrote Romeo and Juliet?', 'Jane Austen', 'William Shakespeare', 'Charles Dickens', 'Mark Twain', 'B', 10, 4),
('What is the chemical symbol for Gold?', 'Ag', 'Au', 'Gd', 'Go', 'B', 10, 5),
('Which country is home to the Eiffel Tower?', 'Germany', 'Belgium', 'France', 'Switzerland', 'C', 10, 6),
('What is the smallest prime number?', '1', '2', '3', '5', 'B', 10, 7),
('What is the capital of Japan?', 'Osaka', 'Kyoto', 'Tokyo', 'Yokohama', 'C', 10, 8),
('How many continents are there?', '5', '6', '7', '8', 'C', 10, 9),
('What is the currency of the United Kingdom?', 'Euro', 'Pound Sterling', 'Dollar', 'Franc', 'B', 10, 10);