import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onValue, onDisconnect, set, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBedu3Z7AMdD5dmaudzeCwxzkegpX5Qfvs",
  authDomain: "nihongo-trinity.firebaseapp.com",
  projectId: "nihongo-trinity",
  databaseURL: "https://nihongo-trinity-default-rtdb.firebaseio.com",
  storageBucket: "nihongo-trinity.firebasestorage.app",
  messagingSenderId: "369587231010",
  appId: "1:369587231010:web:6f69eb2516d660b9dfad7b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const sessionKey = "nihongoChatUser";
let currentUser = localStorage.getItem(sessionKey);

const coreMembers = ["umaedi", "iqbal", "rifki", "fasya"];
const isCore = currentUser && coreMembers.includes(currentUser.toLowerCase());

let currentRoom = null; 
let activeChatListener = null;
let activeWipeListener = null; // SENSOR SAPU JAGAT
let sessionLastRead = Date.now();
let unreadDividerAdded = false;
const pendingMessages = [];
let currentOnlineUsers = []; 

const chatListView = document.getElementById("chatListView");
const chatRoomView = document.getElementById("chatRoomView");
const backToListBtn = document.getElementById("backToListBtn");
const chatImageUpload = document.getElementById("chatImageUpload");
const sendImageBtn = document.getElementById("sendImageBtn");

if (isCore && sendImageBtn) sendImageBtn.style.display = "block"; 

if (sendImageBtn && chatImageUpload) {
    sendImageBtn.addEventListener("click", () => chatImageUpload.click());
    chatImageUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const maxSize = 400; 
                let width = img.width; let height = img.height;
                if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
                else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                const base64Img = canvas.toDataURL("image/jpeg", 0.6); 

                if (confirm("Kirim gambar ini ke grup?")) {
                    const dbRefName = currentRoom === "core" ? "messages" : "messages_public";
                    push(ref(db, dbRefName), { name: currentUser, message: "", image: base64Img, timestamp: Date.now() });
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        chatImageUpload.value = ""; 
    });
}

function listenRoomPreview(roomType) {
    const refName = roomType === "core" ? "messages" : "messages_public";
    const recentMessages = query(ref(db, refName), limitToLast(30));
    
    onValue(recentMessages, (snapshot) => {
        if (snapshot.exists()) {
            let unreadCount = 0;
            let lastMsgData = null;
            let lastRead = Number(localStorage.getItem("lastRead_" + roomType));
            
            if (!lastRead && roomType === "core") lastRead = Number(localStorage.getItem("lastReadMessageTime")) || Date.now();
            else if (!lastRead) lastRead = Date.now();

            snapshot.forEach((childSnap) => {
                const msg = childSnap.val();
                lastMsgData = msg; 
                if (msg.timestamp > lastRead && msg.name !== currentUser && msg.name !== "SYSTEM" && currentRoom !== roomType) {
                    unreadCount++;
                }
            });

            const lastMsgEl = document.getElementById(roomType === "core" ? "lastMsgCore" : "lastMsgPublic");
            const timeEl = document.getElementById(roomType === "core" ? "timeCore" : "timePublic");
            const badgeEl = document.getElementById(roomType === "core" ? "badgeCore" : "badgePublic");

            if (lastMsgData) {
                let msgText = lastMsgData.image ? "📷 Mengirim foto" : lastMsgData.message;
                if (lastMsgData.isCountdown) msgText = "⚠️ Pembersihan sistem dimulai...";
                if (lastMsgData.isPostClear) msgText = "✅ Ruang obrolan bersih.";

                const isMe = lastMsgData.name === currentUser ? "Anda: " : (lastMsgData.name === "SYSTEM" ? "Sistem: " : `${lastMsgData.name}: `);
                lastMsgEl.textContent = isMe + msgText;
                
                const dateObj = new Date(lastMsgData.timestamp);
                const hrs = String(dateObj.getHours()).padStart(2, '0');
                const mins = String(dateObj.getMinutes()).padStart(2, '0');
                timeEl.textContent = `${hrs}:${mins}`;
            }

            if (unreadCount > 0) {
                badgeEl.textContent = unreadCount > 9 ? "9+" : unreadCount;
                badgeEl.style.display = "block";
                lastMsgEl.style.color = "#fff"; 
            } else {
                badgeEl.style.display = "none";
                lastMsgEl.style.color = "var(--muted)";
            }
        }
    });
}

window.openRoom = function(type) {
    currentRoom = type;
    if(chatListView) chatListView.style.display = "none";
    if(chatRoomView) chatRoomView.style.display = "flex";
    
    const roomLabel = document.getElementById("roomLabel");
    const roomTitle = document.getElementById("roomTitle");
    const roomIcon = document.getElementById("roomIcon");
    const coreMemberAvatarList = document.getElementById("coreMemberAvatarList");
    const dbRefName = type === "core" ? "messages" : "messages_public";

    if (type === "core") {
        if(roomLabel) roomLabel.textContent = "TRINITY CORE"; 
        if(roomTitle) roomTitle.textContent = "Markas Utama";
        if(roomIcon) { roomIcon.textContent = "🛡️"; roomIcon.style.background = "#D32F2F"; }
        if(coreMemberAvatarList) coreMemberAvatarList.style.display = "flex";
    } else {
        if(roomLabel) roomLabel.textContent = "PUBLIC LOUNGE"; 
        if(roomTitle) roomTitle.textContent = "Ruang Publik";
        if(roomIcon) { roomIcon.textContent = "🌐"; roomIcon.style.background = "#1E88E5"; }
        if(coreMemberAvatarList) coreMemberAvatarList.style.display = "none"; 
    }

    if (chatBox) chatBox.replaceChildren();
    pendingMessages.length = 0;
    unreadDividerAdded = false;

    renderOnlineUsers();

    let lastReadVal = Number(localStorage.getItem("lastRead_" + type));
    if(!lastReadVal && type === "core") lastReadVal = Number(localStorage.getItem("lastReadMessageTime"));
    sessionLastRead = lastReadVal || Date.now();
    localStorage.setItem("lastRead_" + type, Date.now());

    if (activeChatListener) activeChatListener(); 
    if (activeWipeListener) activeWipeListener(); 

    // Aliran Teks Real-Time
    activeChatListener = onChildAdded(ref(db, dbRefName), (snapshot) => {
        const data = snapshot.val();
        const msgKey = snapshot.key; 
        pendingMessages.push({ data, key: msgKey });
        renderMessage(data, msgKey);
    });

    // PENDETEKSI PEMUSNAHAN MUTLAK (Sapu Jagat Layar)
    activeWipeListener = onValue(ref(db, dbRefName), (snapshot) => {
        // Jika snapshot kosong (dihapus oleh admin.js)
        if (!snapshot.exists()) {
            if (chatBox) chatBox.replaceChildren();
            pendingMessages.length = 0;
            unreadDividerAdded = false;
        }
    });
};

if (isCore) {
    const cardCore = document.getElementById("roomCardCore");
    if(cardCore) cardCore.style.display = "flex";
    listenRoomPreview("public");
    listenRoomPreview("core");

    if(backToListBtn) {
        backToListBtn.addEventListener("click", () => {
            if(currentRoom) localStorage.setItem("lastRead_" + currentRoom, Date.now()); 
            currentRoom = null;
            chatRoomView.style.display = "none";
            chatListView.style.display = "flex";
            if (activeChatListener) { activeChatListener(); activeChatListener = null; }
            if (activeWipeListener) { activeWipeListener(); activeWipeListener = null; }
        });
    }
} else {
    if(backToListBtn) {
        backToListBtn.innerHTML = "×";
        backToListBtn.style.fontSize = "28px";
        backToListBtn.style.padding = "0 5px";
        backToListBtn.onclick = () => { window.location.href = "../index.html"; };
    }
    openRoom("public");
}

window.addEventListener('profilesUpdated', () => {
    if(chatBox && currentRoom) {
        chatBox.replaceChildren(); 
        unreadDividerAdded = false;
        pendingMessages.forEach(item => renderMessage(item.data, item.key)); 
    }
    renderOnlineUsers(); 
});

if (currentUser) {
    const myPresenceRef = ref(db, 'online_users/' + currentUser);
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) { set(myPresenceRef, true); onDisconnect(myPresenceRef).remove(); }
    });
}

onValue(ref(db, 'online_users'), (snapshot) => {
    if (snapshot.exists()) currentOnlineUsers = Object.keys(snapshot.val());
    else currentOnlineUsers = [];
    renderOnlineUsers(); 
});

function renderOnlineUsers() {
    const onlineCountText = document.getElementById("onlineCountText");
    if (!onlineCountText || !currentRoom) return;

    let visibleUsers = currentOnlineUsers;
    if (currentRoom === "core") visibleUsers = currentOnlineUsers.filter(name => coreMembers.includes(name.toLowerCase()));

    if (visibleUsers.length === 0) { onlineCountText.innerHTML = `Tidak ada yang online`; return; }

    const displayNames = visibleUsers.map(name => {
        if (name.toLowerCase() === currentUser.toLowerCase()) return "Kamu";
        const profile = window.userProfiles ? window.userProfiles[name] : null;
        return profile && profile.displayName ? profile.displayName : name;
    });
    
    onlineCountText.innerHTML = `${visibleUsers.length} Online: <span style="color: #D4AF37; font-weight: 600;">${displayNames.join(', ')}</span>`;
}

function setLoginState(user) {
    if (user) {
        if(chatInput) chatInput.disabled = false;
        if(sendBtn) sendBtn.disabled = false;
    } else {
        if(chatInput) chatInput.disabled = true;
        if(sendBtn) sendBtn.disabled = true;
    }
}

function renderMessage(data, msgKey) {
    if (!currentUser || !chatBox || !currentRoom) return;
    const senderName = data.name || "Unknown";

    // ==========================================
    // 1. SISTEM PESAN BOT (HACKER) & HANGUS OTOMATIS
    // ==========================================
    if (senderName === "SYSTEM") {
        if (data.isPostClear && localStorage.getItem("hidden_sys_" + msgKey)) return;

        const msgDiv = document.createElement("div");
        msgDiv.className = `msg is-other`; 
        
        const headerDiv = document.createElement("div");
        headerDiv.className = "msg-header";
        
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        
        const sender = document.createElement("strong");
        sender.textContent = "SYSTEM";
        const badge = document.createElement("span");
        badge.className = "tag-founder"; 

        // A. JIKA INI PESAN COUNTDOWN INTRUDER (Bot Hapus)
        if (data.isCountdown) {
            let timeLeft = 10 - Math.floor((Date.now() - data.timestamp) / 1000);
            if (timeLeft < 0) return; // Jika telat masuk, abaikan saja (nanti layar kehapus otomatis via onValue).

            avatar.style.background = "#000"; 
            avatar.style.border = "1px solid #00f3ff";
            avatar.innerHTML = `<span style="font-size:14px;">👾</span>`; 
            
            badge.style.background = "#000";
            badge.style.color = "#00f3ff";
            badge.style.borderColor = "#00f3ff";
            badge.innerText = "⚠️ INTRUDER BOT"; 
            sender.appendChild(badge);
            
            headerDiv.append(avatar, sender);
            
            const contentDiv = document.createElement("div");
            contentDiv.className = "msg-content";
            const textSpan = document.createElement("span");
            textSpan.id = `countdownText_${msgKey}`;
            textSpan.style.fontFamily = "monospace"; // Biar fontnya gaya hacker
            textSpan.innerHTML = `<em>${data.message}</em> <strong style="color:#ff3b30; font-size:16px;">${timeLeft} detik</strong>.`;
            contentDiv.appendChild(textSpan);

            msgDiv.append(headerDiv, contentDiv);
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;

            if (timeLeft > 0) {
                const timer = setInterval(() => {
                    let newTimeLeft = 10 - Math.floor((Date.now() - data.timestamp) / 1000);
                    if (newTimeLeft > 0) {
                        const el = document.getElementById(`countdownText_${msgKey}`);
                        if(el) el.innerHTML = `<em>${data.message}</em> <strong style="color:#ff3b30; font-size:16px;">${newTimeLeft} detik</strong>.`;
                    } else {
                        clearInterval(timer);
                    }
                }, 1000);
            }
            return;
        }

        // B. JIKA INI PESAN POST-CLEAR (Bot Selesai & Menghilang)
        if (data.isPostClear) {
            avatar.style.background = "#131921"; 
            avatar.innerHTML = `<span style="font-size:14px; color:#4CAF50;">🤖</span>`; 

            badge.className = "tag-core"; 
            badge.style.background = "#4CAF50";
            badge.style.color = "#fff";
            badge.style.borderColor = "#4CAF50";
            badge.innerText = "✅ SELESAI"; 
            sender.appendChild(badge);
            
            headerDiv.append(avatar, sender);

            const contentDiv = document.createElement("div");
            contentDiv.className = "msg-content";
            const message = document.createElement("span");
            message.innerHTML = `${data.message}<br><br><span style="font-size:9px; color:var(--muted); font-weight:normal;">(Pesan sistem ini akan hangus dalam 60 detik)</span>`;
            contentDiv.appendChild(message);

            msgDiv.append(headerDiv, contentDiv);
            chatBox.appendChild(msgDiv);
            chatBox.scrollTop = chatBox.scrollHeight;

            // Timer Rahasia: Hangus 60 Detik SETELAH MEREKA BUKA & BACA CHAT INI
            localStorage.setItem("hidden_sys_" + msgKey, "true"); // Tandai sudah terbaca
            
            setTimeout(() => {
                msgDiv.style.transition = "opacity 1.5s ease, transform 1.5s ease";
                msgDiv.style.opacity = "0";
                msgDiv.style.transform = "scale(0.9)";
                setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 1500);
            }, 60000); 
            return;
        }
    }

    // ==========================================
    // 2. PESAN CHAT NORMAL
    // ==========================================
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
    const rawName = senderName.toLowerCase();
    
    if (rawName === "umaedi") {
        sender.innerHTML += `<span class="tag-founder">👑 FOUNDER</span>`;
    } else if (coreMembers.includes(rawName)) {
        sender.innerHTML += `<span class="tag-core">⭐ CORE TEAM</span>`;
    }
    
    headerDiv.append(avatar, sender);

    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";
    
    if (data.message) {
        const message = document.createElement("span");
        message.textContent = data.message;
        contentDiv.appendChild(message);
    }

    if (data.image) {
        const imgEl = document.createElement("img");
        imgEl.src = data.image;
        imgEl.className = "chat-image-attachment";
        imgEl.style.width = "100%";
        imgEl.style.maxWidth = "250px";
        imgEl.style.borderRadius = "8px";
        imgEl.style.marginTop = data.message ? "8px" : "0";
        imgEl.style.cursor = "zoom-in";
        imgEl.style.border = "1px solid rgba(255,255,255,0.1)";
        
        imgEl.onclick = () => {
            const w = window.open("");
            w.document.write(`<body style="margin:0; background:#0b0f14; display:grid; place-items:center; height:100vh;"><img src="${data.image}" style="max-width:100%; max-height:100vh; object-fit:contain;"></body>`);
        };
        contentDiv.appendChild(imgEl);
    }

    msgDiv.append(headerDiv, contentDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    localStorage.setItem("lastRead_" + currentRoom, Date.now());
}

function sendMessage() {
    if (!chatInput || !currentRoom) return;
    const dbRefName = currentRoom === "core" ? "messages" : "messages_public";
    const chatRef = ref(db, dbRefName);
    const text = chatInput.value.trim();
    if (text !== "" && currentUser) {
        push(chatRef, { name: currentUser, message: text, timestamp: Date.now() });
        chatInput.value = ""; 
    }
}

setLoginState(currentUser);

if(sendBtn && chatInput) {
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
}