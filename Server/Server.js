import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import session from "express-session";
import file_store from "session-file-store";
import f from "session-file-store";
dotenv.config();

const App = express();
const Port = process.env.PORT || 8080;
const Database = new pg.Pool({
  connectionString: process.env.DB_URL,
});

// Generate random session secret if not found
let SessionSecret = process.env.SESSION_SECRET;
if (!SessionSecret) {
  SessionSecret = Math.random().toString(36).slice(2) + Date.now().toString(36);
}

App.set("trust proxy", true);
const FileStore = file_store(session);

App.use(
  session({
    store: new FileStore({
      path: "./sessions",
      ttl: 1000 * 60 * 60 * 24 * 365 * 5,
      retries: 0,
    }),
    secret: SessionSecret,
    saveUninitialized: true,
    resave: false,
    cookie: {
      secure: "auto",
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 365 * 5,
    },
  })
);

function CheckDatabaseConnection() {
  Database.connect()
    .then(() => {
      console.log("Database connected successfully");
      return true;
    })
    .catch((Err) => {
      console.error("Database connection error");
      return false;
    });
  return false;
}
CheckDatabaseConnection();

// Initialization
App.use(cors({ credentials: true, origin: true }));
App.use(express.json());

App.get("/", (Request, Response) => {
  Response.json("API Response Sucessful!");
});

App.get("/fetch-messages", async (_, Response) => {
  try {
    const Result = await Database.query(
      "SELECT * FROM messages ORDER BY MessageID DESC LIMIT $1",
      [process.env.FETCH_LIMIT || 100]
    );
    Response.json(Result.rows);
  } catch (Error) {
    Response.status(500).json({ Error: "Internal server error" });
  }
});

function GetSessionID(Request) {
  return Request.session.id;
}

App.get("/get-hash", (Request, Response) => {
  const SessionID = GetSessionID(Request);
  Response.json({ SessionID: SessionID });
});

App.post("/add-message", async (Request, Response) => {
  const { Username, MessageContent, PfpURL } = Request.body;
  if (!Username || !MessageContent) {
    return Response.status(400).json({
      Error: "Name and message are required",
    });
  }
  const SessionID = GetSessionID(Request);
  try {
    await Database.query(
      "INSERT INTO messages (Username, MessageContent, PfpURL, SessionHash) VALUES ($1, $2, $3, $4)",
      [Username, MessageContent, PfpURL, SessionID]
    );
    Response.status(201).json({ Success: "Message added successfully" });
  } catch (Error) {
    console.error("Error adding message:", Error);
    Response.status(500).json({ Error: "Internal server error" });
  }
});

App.post("/delete-message", async (Request, Response) => {
  const { MessageID } = Request.body;
  if (!MessageID) {
    return Response.status(400).json({ Error: "Message ID is required" });
  }
  const SessionID = GetSessionID(Request);
  try {
    const Result = await Database.query(
      "DELETE FROM messages WHERE MessageID = $1 AND SessionHash = $2",
      [MessageID, SessionID]
    );
    if (Result.rowCount === 0) {
      return Response.status(404).json({
        Error: "Message not found or unauthorized",
      });
    }
    Response.json({ Success: "Message deleted successfully" });
  } catch (Error) {
    Response.status(500).json({ Error: "Internal server error" });
  }
});

App.listen(Port, () => {
  console.log(`Server is running on http://localhost:${Port}/`);
});
