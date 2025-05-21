import ServerUrl from "./Config.js";
export default class SessionManager {
  static UserSessionID = null;

  static async GetHash() {
    try {
      const Response = await fetch(`${ServerUrl}/get-hash`, {
        credentials: "include",
      });
      const Data = await Response.json();
      return Data.SessionID;
    } catch (Error) {
      console.error("Error fetching session ID:", Error);
      return null;
    }
  }

  static async Init() {
    this.UserSessionID = await this.GetHash();
    console.log("User Hash:", this.UserSessionID);
  }
}