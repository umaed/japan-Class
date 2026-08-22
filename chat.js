import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onValue, onDisconnect, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBedu3Z7AMdD5dmaudzeCwxzkegpX5Qfvs",
  authDomain: "nihongo-trinity.firebaseapp.com",
  projectId: "nihongo-trinity",
  databaseURL: "https://nihongo-trinity-default-rtdb.firebaseio.com",
  storageBucket: "nihongo-trinity.firebasestorage.app",
  messagingSenderId: "369587231010",
  appId: "1:369587231010:web:6f69eb2516d660b9dfad7b"
};

// SISTEM ANTI TABRAKAN FIREBASE
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const chatRef = ref(db, "messages");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const sessionKey = "nihongoChatUser";

let currentUser = localStorage.getItem(sessionKey);
const pendingMessages = [];
let sessionLastRead = Number(localStorage.getItem("lastReadMessageTime") || Date.now());
let unreadDividerAdded = false;

window.addEventListener('profilesUpdated', () => {
    if(chatBox) {
        chatBox.replaceChildren(); 
        unreadDividerAdded = false;
        pendingMessages.forEach(renderMessage); 
    }
});

// FITUR DETEKSI ONLINE 
if (currentUser) {
    const myPresenceRef = ref(db, 'online_users/' + currentUser);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myPresenceRef, true);
            onDisconnect(myPresenceRef).remove();
        }
    });
}

const onlineUsersRef = ref(db, 'online_users');
onValue(onlineUsersRef, (snapshot) => {
    const onlineCountText = document.getElementById("onlineCountText");
    if (!onlineCountText) return;

    if (snapshot.exists()) {
        const data = snapshot.val();
        const onlineNames = Object.keys(data); 
        const count = onlineNames.length;
        
        const displayNames = onlineNames.map(name => {
            if (name === currentUser) return "Kamu";
            const profile = window.userProfiles ? window.userProfiles[name] : null;
            return profile && profile.displayName ? profile.displayName : name;
        });
        
        onlineCountText.innerHTML = `${count} Online: <span style="color: #D4AF37; font-weight: 600;">${displayNames.join(', ')}</span>`;
    } else {
        onlineCountText.innerHTML = `Tidak ada yang online`;
    }
});

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

function renderMessage(data) {
    if (!currentUser || !chatBox) return;

    // Proteksi data (mencegah error jika data nama kosong)
    const senderName = data.name || "Unknown";

    if (!unreadDividerAdded && data.timestamp > sessionLastRead && senderName !== currentUser) {
        const divider = document.createElement("div");
        divider.className = "chat-day unread-divider";
        divider.innerText = "PESAN BARU BELUM DIBACA";
        chatBox.appendChild(divider);
        unreadDividerAdded = true;
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${senderName === currentUser ? "is-own" : "is-other"}`;
    const headerDiv = document.createElement("div");
    headerDiv.className = "msg-header";

    const profile = window.userProfiles ? (window.userProfiles[senderName] || {}) : {};
    const displayName = senderName === currentUser ? "Kamu" : (profile.displayName || senderName);
    const isPages = window.location.pathname.includes('/pages/');
    const basePath = isPages ? `../gambar/${senderName.toLowerCase()}.png` : `gambar/${senderName.toLowerCase()}.png`;
    const finalPhoto = profile.photoBase64 || basePath;

    const initial = displayName.charAt(0).toUpperCase();

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.style.overflow = "hidden";
    avatar.style.backgroundColor = "#fff"; 
    avatar.innerHTML = `<img src="${finalPhoto}" alt="${initial}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentNode.style.backgroundColor='#131921'; this.parentNode.innerHTML='${initial}';">`;
    
    const sender = document.createElement("strong");
    sender.textContent = displayName;
    
    headerDiv.append(avatar, sender);

    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";
    const message = document.createElement("span");
    message.textContent = data.message;
    contentDiv.appendChild(message);

    msgDiv.append(headerDiv, contentDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    localStorage.setItem("lastReadMessageTime", Date.now());
}

function sendMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (text !== "" && currentUser) {
        push(chatRef, { name: currentUser, message: text, timestamp: Date.now() });
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
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
}