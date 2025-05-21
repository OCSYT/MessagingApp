import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

//Constants
const App = express();
const Port = process.env.PORT || 8080;
const Database = new pg.Pool({
    connectionString: process.env.DB_URL
});

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

//Initalization
App.use(cors());
App.use(express.json());

App.get("/", (Request, Response) => {
    Response.json("Hello World!");
});

App.get("/fetch-messages", async (_, Response) => {
    try {
        const Result = await Database.query("SELECT * FROM messages ORDER BY MessageID DESC LIMIT $1", [process.env.FETCH_LIMIT || 100]);
        Response.json(Result.rows);
    } catch (Error) {
        Response.status(500).json({ Error: "Internal server error" });
    }
});

App.post("/add-message", async (Request, Response) => {
    const { Username, MessageContent } = Request.body;
    if (!Username || !MessageContent) {
        return Response.status(400).json({ Error: "Name and message are required" });
    }
    try {
        await Database.query("INSERT INTO messages (Username, MessageContent) VALUES ($1, $2)", [Username, MessageContent]);
        Response.status(201).json({ Success: "Message added successfully" });
    } catch (Error) {
        Response.status(500).json({ Error: "Internal server error" });
    }
});

App.listen(Port, () => {
    console.log(`Server is running on http://localhost:${Port}/`);
});
