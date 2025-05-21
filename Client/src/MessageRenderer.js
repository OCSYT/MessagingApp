import MessageManager from "./MessageManager.js";
import SessionManager from "./SessionManager.js";

export default class MessageRenderer {
  static MessageContainer = document.getElementById("MessageContainer");

  static CreateProfileImage(Url) {
    const Img = document.createElement("img");
    Img.src =
      Url ||
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    Img.onerror = function () {
      this.onerror = null;
      this.src =
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    };
    Img.alt = "Pfp";
    Img.className = "Pfp";
    Img.style.width = "50px";
    return Img;
  }

  static CreateTimestampElement(Timestamp) {
    const DateObj = new Date(Timestamp);
    const TimeString = DateObj.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const TimeElement = document.createElement("small");
    TimeElement.className = "Time";
    TimeElement.textContent = TimeString;
    return TimeElement;
  }

  static CreateDeleteButton(MessageId) {
    const Button = document.createElement("button");
    Button.textContent = "Delete";
    Button.className = "Delete";
    Button.onclick = () => MessageManager.DeleteMessage(MessageId);
    return Button;
  }

  static ScrollToBottom() {
    this.MessageContainer.scrollTop = this.MessageContainer.scrollHeight;
  }

  static async AddImages(Text, ParentElement) {
    const UrlRegex = /(https?:\/\/[^\s]+)/gi;
    const Matches = Text.match(UrlRegex);
    if (!Matches) return;

    for (const Url of Matches) {
      const Img = document.createElement("img");
      Img.src = Url;
      Img.alt = "Embedded Image";
      Img.className = "EmbeddedImage";
      Img.style.width = "300px";
      Img.style.display = "block";
      Img.style.marginTop = "8px";
      Img.onload = function () {
        const NewLine = document.createElement("br");
        ParentElement.appendChild(NewLine);
        ParentElement.appendChild(Img);
        MessageRenderer.ScrollToBottom();
      };
      Img.onerror = function () {
        // Not an image or failed to load, do nothing
      };
    }
  }

  static AddMedia(Text, ParentElement) {
    const UrlRegex = /(https?:\/\/[^\s]+)/gi;
    const Matches = Text.match(UrlRegex);
    if (!Matches) return;

    for (const Url of Matches) {
      const Video = document.createElement("video");
      Video.src = Url;
      Video.controls = true;
      Video.className = "EmbeddedVideo";
      Video.style.width = "600px";
      Video.style.display = "block";
      Video.style.marginTop = "8px";
      let VideoHandled = false;

      const CreateAudio = () => {
        const Audio = document.createElement("audio");
        Audio.src = Url;
        Audio.controls = true;
        Audio.className = "EmbeddedAudio";
        Audio.style.display = "block";
        Audio.style.marginTop = "8px";
        Audio.onloadeddata = function () {
          const NewLine = document.createElement("br");
          ParentElement.appendChild(NewLine);
          ParentElement.appendChild(Audio);
          MessageRenderer.ScrollToBottom();
        };
      };

      Video.onloadeddata = function () {
        if (Video.videoWidth > 0 && Video.videoHeight > 0 && !VideoHandled) {
          const NewLine = document.createElement("br");
          ParentElement.appendChild(NewLine);
          ParentElement.appendChild(Video);
          MessageRenderer.ScrollToBottom();
          VideoHandled = true;
        } else {
          CreateAudio();
        }
      };
      Video.onerror = function () {
        if (!VideoHandled) {
          CreateAudio();
        }
      };
      VideoHandled = false;
    }
  }

  static async CreateMessageElement(Message) {
    const MessageElement = document.createElement("div");
    MessageElement.className = "Message";
    MessageElement.dataset.messageid = Message.messageid;

    const PfpImg = this.CreateProfileImage(Message.pfpurl);
    MessageElement.appendChild(PfpImg);

    const TimeElement = this.CreateTimestampElement(Message.timestamp);
    MessageElement.appendChild(TimeElement);

    const Strong = document.createElement("strong");
    Strong.textContent = Message.username;
    MessageElement.appendChild(Strong);

    const MessageContent = Message.messagecontent;
    MessageElement.appendChild(document.createTextNode(`: ${MessageContent}`));

    await this.AddImages(MessageContent, MessageElement);
    this.AddMedia(MessageContent, MessageElement);

    if (
      SessionManager.UserSessionID &&
      Message.sessionhash &&
      SessionManager.UserSessionID === Message.sessionhash
    ) {
      const Button = this.CreateDeleteButton(Message.messageid);
      MessageElement.appendChild(Button);
    }

    return MessageElement;
  }

  static InsertMessageElement(MessageElement, Message, NewMessageMap) {
    this.MessageContainer.appendChild(MessageElement);
    const MessagesArray = Array.from(this.MessageContainer.children);
    MessagesArray.sort((A, B) => {
      const IdA = parseInt(A.dataset.messageid, 10);
      const IdB = parseInt(B.dataset.messageid, 10);
      return IdA - IdB;
    });
    MessagesArray.forEach((Msg) => this.MessageContainer.appendChild(Msg));
    return true;
  }
}