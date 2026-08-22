import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBedu3Z7AMdD5dmaudzeCwxzkegpX5Qfvs",
  authDomain: "nihongo-trinity.firebaseapp.com",
  projectId: "nihongo-trinity",
  databaseURL: "https://nihongo-trinity-default-rtdb.firebaseio.com",
  storageBucket: "nihongo-trinity.firebasestorage.app",
  messagingSenderId: "369587231010",
  appId: "1:369587231010:web:6f69eb2516d660b9dfad7b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatRef = ref(db, "messages");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const sessionKey = "nihongoChatUser";

let currentUser = localStorage.getItem(sessionKey);
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
        localStorage.removeItem(sessionKey);
        if(chatInput) chatInput.disabled = true;
        if(sendBtn) sendBtn.disabled = true;
        if(chatBox) chatBox.replaceChildren();
    }
}

// LOGIKA RENDER PESAN DENGAN FOTO PROFIL
function renderMessage(data) {
    if (!currentUser || !chatBox) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${data.name === currentUser ? "is-own" : "is-other"}`;

    const headerDiv = document.createElement("div");
    headerDiv.className = "msg-header";

    // Format path gambar (karena di dalam folder pages, jadi pakai ../)
    const imgName = data.name.toLowerCase();
    const imagePath = `../gambar/${imgName}.png`;
    const initial = data.name.charAt(0).toUpperCase();

    // Buat elemen Avatar Foto
    const avatar = document.createElement("div");
    avatar.className = `message-avatar avatar-${imgName}`;
    avatar.style.overflow = "hidden";
    avatar.style.backgroundColor = "#fff"; // Background putih jika PNG transparan
    
    // Logika Pintar: Jika error load, background dihapus, lalu isi diubah jadi inisial lagi
    avatar.innerHTML = `<img src="${imagePath}" alt="${initial}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentNode.style.backgroundColor=''; this.parentNode.innerHTML='${initial}';">`;
    
    const sender = document.createElement("strong");
    sender.textContent = data.name;
    
    headerDiv.append(avatar, sender);

    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";
    
    const message = document.createElement("span");
    message.textContent = data.message;
    
    contentDiv.appendChild(message);

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