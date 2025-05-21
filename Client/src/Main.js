import "./Style.css";
const ServerUrl = "https://messagingapp-server.onrender.com";
//const ServerUrl = "http://localhost:8080";
const MessageContainer = document.getElementById("MessageContainer");
const MessageForm = document.getElementById("MessageForm");
let UserSessionID = null;
let AllowAddingMessages = true;

async function GetHash() {
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

GetHash().then((SessionID) => {
  UserSessionID = SessionID;
  console.log("User Hash:", SessionID);
});

function GetFormData() {
  const FormDataObj = new FormData(MessageForm);
  return Object.fromEntries(FormDataObj);
}

MessageForm.addEventListener("submit", SubmitForm);
function SubmitForm(Event) {
  Event.preventDefault();
  if (UserSessionID === null) {
    return;
  }
  const FormDataObj = GetFormData();
  const Username = FormDataObj.Username;
  const MessageContent = FormDataObj.MessageContent;
  const PfpURL =
    FormDataObj.PfpURL ||
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  MessageForm[2].value = "";

  if (!Username || !MessageContent) {
    alert("Name and message are required");
    return;
  }
  const Data = { Username, MessageContent, PfpURL };
  fetch(`${ServerUrl}/add-message`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Data),
  })
    .then((Response) => Response.json())
    .then((ResponseData) => {
      if (ResponseData.Error) {
        alert(ResponseData.Error);
      } else {
        console.log("Message added successfully");
      }
    })
    .catch((Error) => {
      console.error("Error:", Error);
    });
}

let CurrentMessages = new Map();

async function FetchMessages() {
  if (UserSessionID === null) return;

  try {
    const Data = await GetMessagesFromServer();
    const NewMessageMap = CreateMessageMap(Data);

    RemoveStaleMessages(NewMessageMap);
    const MessageAppended = await AddOrUpdateMessages(Data, NewMessageMap);

    if (MessageAppended) {
      ScrollToBottom();
    }
  } catch (Error) {
    console.error("Error fetching messages:", Error);
  }
}

async function GetMessagesFromServer() {
  const Response = await fetch(`${ServerUrl}/fetch-messages`, {
    credentials: "include",
  });
  return await Response.json();
}

function CreateMessageMap(Data) {
  return new Map(Data.map((msg) => [msg.messageid, msg]));
}

function RemoveStaleMessages(NewMessageMap) {
  CurrentMessages.forEach((element, id) => {
    if (!NewMessageMap.has(id)) {
      element.remove();
      CurrentMessages.delete(id);
    }
  });
}

async function AddOrUpdateMessages(Data, NewMessageMap) {
  let MessageAppended = false;
  for (let i = Data.length - 1; i >= 0; i--) {
    if (AllowAddingMessages == false) {
      continue;
    }
    const Message = Data[i];
    if (!CurrentMessages.has(Message.messageid)) {
      AllowAddingMessages = false;
      const MessageElement = await CreateMessageElement(Message, NewMessageMap);
      const Inserted = InsertMessageElement(
        MessageElement,
        Message,
        NewMessageMap
      );

      if (!Inserted) {
        MessageContainer.appendChild(MessageElement);
        MessageAppended = true;
      }

      CurrentMessages.set(Message.messageid, MessageElement);
      AllowAddingMessages = true;
    }
  }

  return MessageAppended;
}

async function CreateMessageElement(Message) {
  const MessageElement = document.createElement("div");
  MessageElement.className = "Message";
  MessageElement.dataset.messageid = Message.messageid;

  const PfpImg = CreateProfileImage(Message.pfpurl);
  MessageElement.appendChild(PfpImg);

  const TimeElement = CreateTimestampElement(Message.timestamp);
  MessageElement.appendChild(TimeElement);

  const Strong = document.createElement("strong");
  Strong.textContent = Message.username;
  MessageElement.appendChild(Strong);

  const MessageContent = Message.messagecontent;
  MessageElement.appendChild(document.createTextNode(`: ${MessageContent}`));

  await AddImages(MessageContent, MessageElement);
  await AddVideos(MessageContent, MessageElement);
  if (
    UserSessionID &&
    Message.sessionhash &&
    UserSessionID === Message.sessionhash
  ) {
    const Button = CreateDeleteButton(Message.messageid);
    MessageElement.appendChild(Button);
  }

  return MessageElement;
}

async function AddImages(Text, ParentElement) {
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
      ScrollToBottom();
    };
    Img.onerror = function () {
      // Not an image or failed to load, do nothing
    };
  }
}

async function AddVideos(Text, ParentElement) {
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
    Video.onloadeddata = function () {
      const NewLine = document.createElement("br");
      ParentElement.appendChild(NewLine);
      ParentElement.appendChild(Video);
      ScrollToBottom();
    };
    Video.onerror = function () {
      // Not a video or failed to load, do nothing
    };
  }
}

function CreateProfileImage(Url) {
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

function CreateTimestampElement(Timestamp) {
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

function CreateDeleteButton(MessageId) {
  const Button = document.createElement("button");
  Button.textContent = "Delete";
  Button.className = "Delete";
  Button.onclick = () => DeleteMessage(MessageId);
  return Button;
}

function InsertMessageElement(MessageElement, Message, NewMessageMap) {
  const Messages = MessageContainer.children;
  for (let i = Messages.length - 1; i >= 0; i--) {
    const ExistingMessageId = Messages[i].dataset.messageid;
    const ExistingMessage = NewMessageMap.get(ExistingMessageId);
    if (ExistingMessage) {
      const ExistingTimestamp = new Date(ExistingMessage.timestamp);
      const NewTimestamp = new Date(Message.timestamp);
      if (NewTimestamp > ExistingTimestamp) {
        MessageContainer.insertBefore(MessageElement, Messages[i]);
        return true;
      }
    }
  }
  return false;
}

function ScrollToBottom() {
  MessageContainer.scrollTop = MessageContainer.scrollHeight;
}

function DeleteMessage(MessageID) {
  if (UserSessionID === null) {
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

setInterval(async () => {
  if (UserSessionID === null) {
    return;
  }
  await FetchMessages();
}, 100);
