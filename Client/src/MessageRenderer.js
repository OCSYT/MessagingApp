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
      // YouTube embed
      const YouTubeMatch = Url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
      );
      if (YouTubeMatch) {
        const VideoId = YouTubeMatch[1];
        const Iframe = document.createElement("iframe");
        Iframe.src = `https://www.youtube.com/embed/${VideoId}`;
        Iframe.width = "560";
        Iframe.height = "315";
        Iframe.style.border = "none";
        Iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        Iframe.allowFullscreen = true;
        Iframe.className = "EmbeddedYouTube";
        Iframe.style.display = "block";
        Iframe.style.marginTop = "8px";
        const NewLine = document.createElement("br");
        ParentElement.appendChild(NewLine);
        ParentElement.appendChild(Iframe);
        console.log("YouTube video embedded:", Url);
        MessageRenderer.ScrollToBottom();
        continue;
      }

      // Video embed
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

  static InsertMessageElement(MessageElement, Message) {
    const NewId = parseInt(Message.messageid, 10);
    const Children = this.MessageContainer.children;

    for (let i = 0; i < Children.length; i++) {
      const ChildId = parseInt(Children[i].dataset.messageid, 10);
      if (NewId < ChildId) {
        this.MessageContainer.insertBefore(MessageElement, Children[i]);
        return true;
      }
    }

    // If no smaller ID was found, it's the newest
    this.MessageContainer.appendChild(MessageElement);
    this.ScrollToBottom();
    return true;
  }
}
