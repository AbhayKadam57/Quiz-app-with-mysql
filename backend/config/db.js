import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
});


pool.getConnection((err,connection)=>{
    if(err){
        console.error("Databse connection failed:",err.message)
    }else{
        console.log("Mysql connected successfully")
    }
})

export default pool.promise()