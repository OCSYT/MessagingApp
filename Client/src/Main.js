import "./Style.css";
import SessionManager from "./SessionManager.js";
import MessageFormHandler from "./MessageFormHandler.js";
import MessageManager from "./MessageManager.js";

// Initialize everything
(async function InitApp() {
  await SessionManager.Init();
  MessageFormHandler.Init();
  setInterval(async () => {
    if (SessionManager.UserSessionID === null) {
      return;
    }
    await MessageManager.FetchMessages();
  }, 100);
})();
