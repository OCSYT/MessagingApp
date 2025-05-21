import "./Style.css";
const ServerUrl = "https://messagingapp-server.onrender.com";
//const ServerUrl = "http://localhost:8080";
const MessageContainer = document.getElementById("MessageContainer");
const MessageForm = document.getElementById("MessageForm");
let UserSessionID = null;

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

let CurrentMessages = new Map(); // Stores message elements by their ID

async function FetchMessages() {
  try {
    const Response = await fetch(`${ServerUrl}/fetch-messages`, {
      credentials: "include",
    });
    const Data = await Response.json();
    const NewMessageMap = new Map(Data.map((msg) => [msg.messageid, msg]));

    // Remove messages that no longer exist
    CurrentMessages.forEach((element, id) => {
      if (!NewMessageMap.has(id)) {
        element.remove();
        CurrentMessages.delete(id);
      }
    });

    // Add or update messages
    let messageAppended = false;
    Data.slice()
      .reverse()
      .forEach((Message) => {
        if (!CurrentMessages.has(Message.messageid)) {
          const MessageElement = document.createElement("div");
          MessageElement.className = "Message";
          MessageElement.dataset.messageid = Message.messageid;

          const PfpImg = document.createElement("img");
            PfpImg.src =
            Message.pfpurl ||
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
            PfpImg.onerror = function () {
            this.onerror = null;
            this.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
            };
            
          PfpImg.alt = "Pfp";
          PfpImg.className = "Pfp";
          PfpImg.style.width = "50px";
          MessageElement.appendChild(PfpImg);

          const Timestamp = new Date(Message.timestamp);
          const TimeString = Timestamp.toLocaleString([], {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const TimeElement = document.createElement("small");
          TimeElement.className = "Time";
          TimeElement.textContent = TimeString;
          MessageElement.appendChild(TimeElement);

          const Strong = document.createElement("strong");
          Strong.textContent = Message.username;
          MessageElement.appendChild(Strong);
          MessageElement.appendChild(
            document.createTextNode(`: ${Message.messagecontent}`)
          );

          if (
            UserSessionID &&
            Message.sessionhash &&
            UserSessionID === Message.sessionhash
          ) {
            const Button = document.createElement("button");
            Button.textContent = "Delete";
            Button.className = "Delete";
            Button.onclick = () => DeleteMessage(Message.messageid);
            MessageElement.appendChild(Button);
          }

          // Insert the new message in the correct position
          let Inserted = false;
          const Messages = MessageContainer.children;
          for (let I = 0; I < Messages.length; I++) {
            const ExistingMessageId = Messages[I].dataset.messageid;
            const ExistingMessage = NewMessageMap.get(ExistingMessageId);
            if (ExistingMessage) {
              const ExistingTimestamp = new Date(ExistingMessage.timestamp);
              const NewTimestamp = new Date(Message.timestamp);
              if (NewTimestamp > ExistingTimestamp) {
                MessageContainer.insertBefore(MessageElement, Messages[I]);
                Inserted = true;
                break;
              }
            }
          }
          if (!Inserted) {
            MessageContainer.appendChild(MessageElement);
            messageAppended = true;
          }
          CurrentMessages.set(Message.messageid, MessageElement);
        }
      });

    // Scroll to bottom if a new message was appended
    if (messageAppended) {
      MessageContainer.scrollTop = MessageContainer.scrollHeight;
    }
  } catch (Error) {
    console.error("Error fetching messages:", Error);
  }
}

function DeleteMessage(MessageID) {
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

setInterval(() => {
  FetchMessages();
}, 100);
