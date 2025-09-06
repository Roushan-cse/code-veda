import express from "express";
import type {Request,Response} from "express";
import { Client } from "pg";
import jwt from "jsonwebtoken";
import * as z from "zod";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const saltRounds = 10;
const JWT_SECRET = "your_secret_key_here"; 

const pgClient = new Client({
connectionString: 'postgresql://neondb_owner:npg_JoAuH2z3xiOd@ep-solitary-sea-ae3g00ro-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
 ssl: {
    rejectUnauthorized: false,
 },
})

async function connect() {
  await pgClient.connect();
}

connect().catch((err) => console.error("DB connection failed:", err));

function authenticateToken(req:Request,res:Response,next:Function){
const authHeader=req.headers['authorization'];
 const token = authHeader && authHeader.split(' ')[1];

 if(!token){
return res.status(401).json({
message:"Token Expired"
})
 }

jwt.verify(token,JWT_SECRET,(err:any,user:any)=>{

if(err){
return res.status(403).json({
message:"Invalid or expired token"
})
}
req.user=user;
next();
})

}

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

app.get("/dashboard", async (req: Request, res: Response) => {
  const {type} =req.query;

  if(type==='stats'){
  const statsquery=`SELECT
  (SELECT COUNT(*) FROM users) AS total_profiles,
  ROUND(AVG(EXTRACT(DAY FROM p.streak)), 1) AS avg_days,
  MAX(EXTRACT(DAY FROM p.streak)) AS max_days,
  MIN(EXTRACT(DAY FROM p.streak)) AS min_days
  FROM profile p;`
 
  const result=await pgClient.query(statsquery);

    res.json({
   success:true,
   stats:result.rows[0]
    });
   return;
  }
});



app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

app.get("/dashboard", (req: Request, res: Response) => {
  res.send("Dashboard endpoint");
});

app.post("/signup", async (req: Request, res: Response) => {
  const requiredBody = z.object({
    email: z.string().min(5).max(50).email(),
    username: z.string().min(3).max(50),
    password: z.string().min(3).max(30),
  });

  const parsedData = requiredBody.safeParse(req.body);
   if (!parsedData.success){
    res.json({
      message: "Incorrect Format",
      error: parsedData.error,
    });
    return;
  }

  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const insertquery = INSERT INTO users(username,email,password) VALUES($1,$2,$3) returning id;
    await pgClient.query(insertquery, [username, email, hashedPassword]);
    res.json({
      message: "You have Signed Up",
    });
  } catch (e) {
    console.error(e);
    res.json({
      message: "Signup has failed",
    });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const query2 = "SELECT * FROM users WHERE username=$1;";
    const findUser = await pgClient.query(query2, [username]);

    if (findUser.rows.length === 0) {
      res.json({
        message: "Invalid Username",
      });
      return;
    }

    const userId = findUser.rows[0].id;
    const passwordMatch = await bcrypt.compare(
      password,
      findUser.rows[0].password
    );

    if (passwordMatch) {
      const token = jwt.sign({ id: userId }, JWT_SECRET);
      res.json({ token });
    } else {
      res.status(403).json({
        message: "Incorrect Credentials",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

app.post("/chat", (req: Request, res: Response) => {
  const { message } = req.body;
  res.json({ echo: message });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});