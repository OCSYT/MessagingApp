import './Style.css'
const ServerUrl = "https://messagingapp-server.onrender.com";
const MessageContainer = document.getElementById("MessageContainer");
const MessageForm = document.getElementById("MessageForm");

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
  if (!Username || !MessageContent) {
    alert("Name and message are required");
    return;
  }
  const Data = { Username, MessageContent };
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
        MessageForm[1].value = ''; //Clear the message input field
        //FetchMessages();
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
      // Only process new messages
      const NewMessages = Data.filter(Message => !LastMessageIds.has(Message.messageid));
      NewMessages.reverse().forEach((Message) => {
        const MessageElement = document.createElement("div");
        MessageElement.className = "Message";
        const strong = document.createElement("strong");
        strong.textContent = Message.username;
        MessageElement.appendChild(strong);
        MessageElement.appendChild(document.createTextNode(`: ${Message.messagecontent}`));
        MessageContainer.appendChild(MessageElement);
        LastMessageIds.add(Message.messageid);
        MessageContainer.scrollTop = MessageContainer.scrollHeight;
      });
    })
    .catch((Error) => {
      console.error("Error:", Error);
    });
}

setInterval(() => {
  FetchMessages();
}, 500);