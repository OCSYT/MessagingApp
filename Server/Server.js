import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import crypto from "crypto";
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
    Response.json("API Response Sucessful!");
});

App.get("/fetch-messages", async (_, Response) => {
    try {
        const Result = await Database.query("SELECT * FROM messages ORDER BY MessageID DESC LIMIT $1", [process.env.FETCH_LIMIT || 100]);
        Response.json(Result.rows);
    } catch (Error) {
        Response.status(500).json({ Error: "Internal server error" });
    }
});


function GetIpHash(Request) {
    let IP = Request.headers["x-forwarded-for"] || Request.socket.remoteAddress || "";
    if (typeof IP === "string" && IP.includes(",")) {
        IP = IP.split(",")[0].trim();
    }
    if (IP === "::1" || IP === "127.0.0.1") {
        IP = "localhost";
    }
    return crypto.createHash("sha256").update(ip).digest("hex");
}

App.get("/get-hash", (Request, Response) => {
    const IPHash = GetIPHash(Request);
    Response.json({ IPHash });
});

App.post("/add-message", async (Request, Response) => {
    const { Username, MessageContent, PfpURL } = Request.body;
    if (!Username || !MessageContent) {
        return Response.status(400).json({ Error: "Name and message are required" });
    }
    const IPHash = GetIPHash(Request)
    try {
        await Database.query(
            "INSERT INTO messages (Username, MessageContent, PfpURL, IPHash) VALUES ($1, $2, $3, $4)",
            [Username, MessageContent, PfpURL, IPHash]
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
    const IPHash = GetIPHash(Request);
    try {
        const Result = await Database.query(
            "DELETE FROM messages WHERE MessageID = $1 AND IPHash = $2",
            [MessageID, IPHash]
        );
        if (Result.rowCount === 0) {
            return Response.status(404).json({ Error: "Message not found or unauthorized" });
        }
        Response.json({ Success: "Message deleted successfully" });
    } catch (Error) {
        Response.status(500).json({ Error: "Internal server error" });
    }
});

App.listen(Port, () => {
    console.log(`Server is running on http://localhost:${Port}/`);
});
