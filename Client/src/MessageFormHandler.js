import SessionManager from "./SessionManager.js";
import ServerUrl from "./Config.js";

export default class MessageFormHandler {
  static MessageForm = document.getElementById("MessageForm");

  static Init() {
    this.MessageForm.addEventListener("submit", this.SubmitForm.bind(this));
  }

  static GetFormData() {
    const FormDataObj = new FormData(this.MessageForm);
    return Object.fromEntries(FormDataObj);
  }

  static SubmitForm(Event) {
    Event.preventDefault();
    if (SessionManager.UserSessionID === null) {
      return;
    }
    const FormDataObj = this.GetFormData();
    const Username = FormDataObj.Username;
    const MessageContent = FormDataObj.MessageContent;
    const PfpURL =
      FormDataObj.PfpURL ||
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

    this.MessageForm[2].value = "";

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
}