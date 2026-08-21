import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBedu3Z7AMdD5dmaudzeCwxzkegpX5Qfvs",
  authDomain: "nihongo-trinity.firebaseapp.com",
  projectId: "nihongo-trinity",
  databaseURL: "https://nihongo-trinity-default-rtdb.firebaseio.com",
  storageBucket: "nihongo-trinity.firebasestorage.app",
  messagingSenderId: "369587231010",
  appId: "1:369587231010:web:6f69eb2516d660b9dfad7b",
  measurementId: "G-H8R4K3JRRH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatRef = ref(db, "messages");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const sessionKey = "nihongoChatUser";
let currentUser = sessionStorage.getItem(sessionKey);
const pendingMessages = [];

function setLoginState(user) {
    currentUser = user;
    if (user) {
        if(chatInput) chatInput.disabled = false;
        if(sendBtn) sendBtn.disabled = false;
        if(chatBox) {
            chatBox.replaceChildren();
            pendingMessages.forEach(renderMessage);
        }
        if(chatInput) chatInput.focus();
    } else {
        sessionStorage.removeItem(sessionKey);
        if(chatInput) chatInput.disabled = true;
        if(sendBtn) sendBtn.disabled = true;
        if(chatBox) chatBox.replaceChildren();
    }
}

// PERBAIKAN STRUKTUR PESAN AGAR BISA RAPI DAN WORD-WRAP BEKERJA
function renderMessage(data) {
    if (!currentUser || !chatBox) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${data.name === currentUser ? "is-own" : "is-other"}`;

    // 1. Bungkus Header (Menyimpan Avatar & Nama)
    const headerDiv = document.createElement("div");
    headerDiv.className = "msg-header";

    const avatar = document.createElement("span");
    avatar.className = `message-avatar avatar-${data.name.toLowerCase()}`;
    avatar.textContent = data.name.charAt(0);
    
    const sender = document.createElement("strong");
    sender.textContent = data.name;
    
    headerDiv.append(avatar, sender);

    // 2. Bungkus Konten (Menyimpan Isi Pesan)
    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";
    
    const message = document.createElement("span");
    message.textContent = data.message;
    
    contentDiv.appendChild(message);

    // Masukkan ke dalam div utama pesan
    msgDiv.append(headerDiv, contentDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();

    if (text !== "" && currentUser) {
        push(chatRef, {
            name: currentUser,
            message: text,
            timestamp: Date.now()
        });
        chatInput.value = ""; 
    }
}

onChildAdded(chatRef, (snapshot) => {
    const data = snapshot.val();
    pendingMessages.push(data);
    renderMessage(data);
});

setLoginState(currentUser);

if(sendBtn && chatInput) {
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
}
