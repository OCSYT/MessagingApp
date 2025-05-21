import MessageRenderer from "./MessageRenderer.js";
import SessionManager from "./SessionManager.js";
import ServerUrl from "./Config.js";

export default class MessageManager {
  static CurrentMessages = new Map();
  static AllowAddingMessages = true;

  static async FetchMessages() {
    if (SessionManager.UserSessionID === null) return;

    try {
      const Data = await this.GetMessagesFromServer();
      const NewMessageMap = this.CreateMessageMap(Data);

      this.RemoveStaleMessages(NewMessageMap);
      const MessageAppended = await this.AddOrUpdateMessages(Data, NewMessageMap);

      if (MessageAppended) {
        MessageRenderer.ScrollToBottom();
      }
    } catch (Error) {
      console.error("Error fetching messages:", Error);
    }
  }

  static async GetMessagesFromServer() {
    const Response = await fetch(`${ServerUrl}/fetch-messages`, {
      credentials: "include",
    });
    return await Response.json();
  }

  static CreateMessageMap(Data) {
    return new Map(Data.map((msg) => [msg.messageid, msg]));
  }

  static RemoveStaleMessages(NewMessageMap) {
    this.CurrentMessages.forEach((element, id) => {
      if (!NewMessageMap.has(id)) {
        element.remove();
        this.CurrentMessages.delete(id);
      }
    });
  }

  static async AddOrUpdateMessages(Data, NewMessageMap) {
    let MessageAppended = false;
    for (let i = Data.length - 1; i >= 0; i--) {
      const Message = Data[i];
      if (!this.CurrentMessages.has(Message.messageid) && this.AllowAddingMessages) {
        this.AllowAddingMessages = false;
        const MessageElement = await MessageRenderer.CreateMessageElement(Message, NewMessageMap);
        const Inserted = MessageRenderer.InsertMessageElement(
          MessageElement,
          Message,
          NewMessageMap
        );

        if (!Inserted) {
          MessageRenderer.MessageContainer.appendChild(MessageElement);
          MessageAppended = true;
        }

        this.CurrentMessages.set(Message.messageid, MessageElement);
        this.AllowAddingMessages = true;
      }
    }
    return MessageAppended;
  }

  static DeleteMessage(MessageID) {
    if (SessionManager.UserSessionID === null) {
      return;
    }
    fetch(`${ServerUrl}/delete-message`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ MessageID }),
    })
      .then((Response) => Response.json())
      .then((ResponseData) => {
        if (ResponseData.Error) {
          alert(ResponseData.Error);
        } else {
          console.log("Message deleted successfully");
        }
      })
      .catch((Error) => {
        console.error("Error deleting message:", Error);
      });
  }
}