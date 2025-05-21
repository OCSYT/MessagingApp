import './Style.css'
const ServerUrl = "https://messagingapp-server.onrender.com"
//const ServerUrl = "http://localhost:8080";
const MessageContainer = document.getElementById("MessageContainer");
const MessageForm = document.getElementById("MessageForm");
let UserIPHash = null;

async function GetIpHash() {
  try {
    const Response = await fetch(`${ServerUrl}/get-hash`);
    const Data = await Response.json();
    return Data.IPHash;
  } catch (Error) {
    console.error("Error fetching IP hash:", Error);
    return null;
  }
}

GetIpHash().then((IPHash) => {
  UserIPHash = IPHash;
  console.log("User IP Hash:", UserIPHash);
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
  const PfpURL = FormDataObj.PfpURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  if (!Username || !MessageContent) {
    alert("Name and message are required");
    return;
  }
  const Data = { Username, MessageContent, PfpURL };
  fetch(`${ServerUrl}/add-message`, {
    method: "POST",
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
        MessageForm[1].value = '';
        console.log("Message added successfully");
      }
    })
    .catch((Error) => {
      console.error("Error:", Error);
    });
}

let LastMessageIds = new Set();

function FetchMessages() {
  fetch(`${ServerUrl}/fetch-messages`)
    .then((Response) => Response.json())
    .then((Data) => {
      const CurrentIds = new Set(Data.map(Msg => Msg.MessageId));
      Array.from(MessageContainer.children).forEach(Child => {
        const MessageID = Child.dataset && Child.dataset.messageid;
        if (MessageID && !CurrentIds.has(MessageID)) {
          MessageContainer.removeChild(Child);
          LastMessageIds.delete(MessageID);
        }
      });

      const NewMessages = Data.filter(Message => !LastMessageIds.has(Message.messageid));
      NewMessages.reverse().forEach((Message) => {
        const MessageElement = document.createElement("div");
        MessageElement.className = "Message";
        MessageElement.dataset.messageid = Message.messageid;

        // Add profile picture image
        const PfpImg = document.createElement("img");
        PfpImg.src = Message.pfpurl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
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
        MessageElement.appendChild(document.createTextNode(`: ${Message.messagecontent}`));

        if (UserIPHash && Message.iphash && UserIPHash === Message.iphash) {
          const Button = document.createElement("button");
          Button.textContent = "Delete";
          Button.className = "Delete";
          Button.onclick = () => {
            DeleteMessage(Message.messageid);
          };
          MessageElement.appendChild(Button);
        }

        MessageContainer.appendChild(MessageElement);
        LastMessageIds.add(Message.MessageId);
        MessageContainer.scrollTop = MessageContainer.scrollHeight;
      });
    })
    .catch((Error) => {
      console.error("Error:", Error);
    });
}

function DeleteMessage(MessageID) {
  fetch(`${ServerUrl}/delete-message`, {
    method: "POST",
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