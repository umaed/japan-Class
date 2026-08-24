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
let activeWipeListener = null; 
let activeTypingListener = null;
let sessionLastRead = Date.now();
let unreadDividerAdded = false;
const pendingMessages = [];
let currentOnlineUsers = []; 

let activeReplyData = null;
const replyPreviewArea = document.getElementById("replyPreviewArea");
const replyPreviewName = document.getElementById("replyPreviewName");
const replyPreviewText = document.getElementById("replyPreviewText");
const cancelReplyBtn = document.getElementById("cancelReplyBtn");

const chatListView = document.getElementById("chatListView");
const chatRoomView = document.getElementById("chatRoomView");
const backToListBtn = document.getElementById("backToListBtn");
const chatImageUpload = document.getElementById("chatImageUpload");
const sendImageBtn = document.getElementById("sendImageBtn");
const recordAudioBtn = document.getElementById("recordAudioBtn"); // Tombol Voice Note

const typingIndicatorContainer = document.createElement("div");
typingIndicatorContainer.className = "typing-indicator-container";
typingIndicatorContainer.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><span id="typingUserNameText">Seseorang sedang mengetik...</span>`;
let typingTimeout = null;

// Tampilkan Fitur Eksklusif Jika Founder
if (isCore) {
    if(sendImageBtn) sendImageBtn.style.display = "block"; 
    if(recordAudioBtn) recordAudioBtn.style.display = "block";
}

if (cancelReplyBtn) cancelReplyBtn.addEventListener("click", cancelReply);

function cancelReply() {
    activeReplyData = null;
    if (replyPreviewArea) replyPreviewArea.style.display = "none";
}

function triggerReply(name, text) {
    activeReplyData = { name, text };
    if (replyPreviewArea) {
        replyPreviewArea.style.display = "flex";
        replyPreviewName.textContent = name;
        replyPreviewText.textContent = text;
    }
    if (chatInput) chatInput.focus();
}

// ==========================================
// FITUR PEREKAM SUARA (VOICE NOTE)
// ==========================================
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

if (recordAudioBtn) {
    recordAudioBtn.addEventListener("click", async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // webm sangat ringan
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        const base64Audio = reader.result;
                        if (confirm("Kirim rekaman suara ini?")) {
                            const dbRefName = currentRoom === "core" ? "messages" : "messages_public";
                            let payload = { name: currentUser, message: "", audio: base64Audio, timestamp: Date.now() };
                            if (activeReplyData) payload.replyTo = activeReplyData;
                            push(ref(db, dbRefName), payload);
                            cancelReply();
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    
                    // Matikan mic agar tidak bocor
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                isRecording = true;
                recordAudioBtn.style.color = "#D32F2F"; // Berubah merah saat merekam
                recordAudioBtn.style.animation = "pulseGlow 1s infinite";
                if(chatInput) chatInput.placeholder = "Merekam suara... (Klik mic lagi untuk stop)";
            } catch (err) {
                alert("Gagal mengakses mikrofon. Pastikan Anda memberi izin akses mic.");
            }
        } else {
            // STOP Merekam
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }
            isRecording = false;
            recordAudioBtn.style.color = "#8B9BB4"; // Kembali abu-abu
            recordAudioBtn.style.animation = "none";
            if(chatInput) chatInput.placeholder = "Tulis pesan ke grup...";
        }
    });
}

// ==========================================
// KIRIM GAMBAR (MENDUKUNG REPLY)
// ==========================================
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
                    let payload = { name: currentUser, message: "", image: base64Img, timestamp: Date.now() };
                    if (activeReplyData) payload.replyTo = activeReplyData;
                    push(ref(db, dbRefName), payload);
                    cancelReply();
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
            let lastRead = Number(localStorage.getItem("lastRead_" + roomType)) || Date.now();

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
                // Modifikasi preview teks kalau ada VN
                let msgText = lastMsgData.image ? "📷 Mengirim foto" : (lastMsgData.audio ? "🎤 Voice Note" : lastMsgData.message);
                if (lastMsgData.isCountdown) msgText = "⚠️ Pembersihan sistem dimulai...";
                if (lastMsgData.isPostClear) msgText = "✅ Ruang obrolan bersih.";

                const isMe = lastMsgData.name === currentUser ? "Anda: " : (lastMsgData.name === "SYSTEM" ? "System: " : `${lastMsgData.name}: `);
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
    cancelReply(); 
    
    if(chatListView) chatListView.style.display = "none";
    if(chatRoomView) chatRoomView.style.display = "flex";
    
    const roomLabel = document.getElementById("roomLabel");
    const roomTitle = document.getElementById("roomTitle");
    const roomIcon = document.getElementById("roomIcon");
    const coreMemberAvatarList = document.getElementById("coreMemberAvatarList");
    const dbRefName = type === "core" ? "messages" : "messages_public";
    const typingRefName = type === "core" ? "typing_core" : "typing_public";

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

    let lastReadVal = Number(localStorage.getItem("lastRead_" + type)) || Date.now();
    sessionLastRead = lastReadVal;
    localStorage.setItem("lastRead_" + type, Date.now());

    if (activeChatListener) activeChatListener(); 
    if (activeWipeListener) activeWipeListener(); 
    if (activeTypingListener) activeTypingListener();

    activeChatListener = onChildAdded(ref(db, dbRefName), (snapshot) => {
        const data = snapshot.val();
        const msgKey = snapshot.key; 
        pendingMessages.push({ data, key: msgKey });
        renderMessage(data, msgKey);
    });

    activeWipeListener = onValue(ref(db, dbRefName), (snapshot) => {
        if (!snapshot.exists()) {
            if (chatBox) chatBox.replaceChildren();
            pendingMessages.length = 0;
            unreadDividerAdded = false;
        }
    });

    activeTypingListener = onValue(ref(db, typingRefName), (snapshot) => {
        if (!chatBox) return;
        let typingUsers = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            typingUsers = Object.keys(data).filter(name => name !== currentUser && data[name] === true);
        }

        if (typingUsers.length > 0) {
            const displayNames = typingUsers.map(name => {
                const profile = window.userProfiles ? window.userProfiles[name] : null;
                return profile && profile.displayName ? profile.displayName : name;
            });
            const textEl = typingIndicatorContainer.querySelector("#typingUserNameText");
            if (displayNames.length === 1) textEl.textContent = `${displayNames[0]} sedang mengetik...`;
            else textEl.textContent = `${displayNames[0]} dan ${displayNames.length - 1} lainnya sedang mengetik...`;

            typingIndicatorContainer.style.display = "flex";
            chatBox.appendChild(typingIndicatorContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
        } else {
            typingIndicatorContainer.style.display = "none";
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
            if (activeTypingListener) { activeTypingListener(); activeTypingListener = null; }
            cancelReply();
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

        if (data.isCountdown) {
            let timeLeft = 10 - Math.floor((Date.now() - data.timestamp) / 1000);
            if (timeLeft <= 0) return; 
            avatar.style.background = "#000"; avatar.style.border = "1px solid #00f3ff"; avatar.innerHTML = `<span style="font-size:14px;">👾</span>`; 
            badge.style.background = "#000"; badge.style.color = "#00f3ff"; badge.style.borderColor = "#00f3ff"; badge.innerText = "⚠️ INTRUDER BOT"; 
            sender.appendChild(badge);
            headerDiv.append(avatar, sender);
            
            const contentDiv = document.createElement("div");
            contentDiv.className = "msg-content";
            const textSpan = document.createElement("span");
            textSpan.id = `countdownText_${msgKey}`;
            textSpan.style.fontFamily = "monospace"; 
            textSpan.innerHTML = `<em>${data.message}</em> <strong style="color:#ff3b30; font-size:16px;">${timeLeft} detik</strong>.`;
            contentDiv.appendChild(textSpan);
            msgDiv.append(headerDiv, contentDiv);
            chatBox.appendChild(msgDiv);
            
            if (typingIndicatorContainer.parentNode === chatBox) chatBox.appendChild(typingIndicatorContainer);
            chatBox.scrollTop = chatBox.scrollHeight;

            if (timeLeft > 0) {
                const timer = setInterval(() => {
                    let newTimeLeft = 10 - Math.floor((Date.now() - data.timestamp) / 1000);
                    if (newTimeLeft > 0) {
                        const el = document.getElementById(`countdownText_${msgKey}`);
                        if(el) el.innerHTML = `<em>${data.message}</em> <strong style="color:#ff3b30; font-size:16px;">${newTimeLeft} detik</strong>.`;
                    } else { clearInterval(timer); }
                }, 1000);
            }
            return;
        }

        if (data.isPostClear) {
            avatar.style.background = "#131921"; avatar.innerHTML = `<span style="font-size:14px; color:#4CAF50;">🤖</span>`; 
            badge.className = "tag-core"; badge.style.background = "#4CAF50"; badge.style.color = "#fff"; badge.style.borderColor = "#4CAF50"; badge.innerText = "✅ SELESAI"; 
            sender.appendChild(badge);
            headerDiv.append(avatar, sender);

            const contentDiv = document.createElement("div");
            contentDiv.className = "msg-content";
            const message = document.createElement("span");
            message.innerHTML = `${data.message}<br><br><span style="font-size:9px; color:var(--muted); font-weight:normal;">(Pesan sistem ini akan hangus dalam 60 detik)</span>`;
            contentDiv.appendChild(message);

            msgDiv.append(headerDiv, contentDiv);
            chatBox.appendChild(msgDiv);
            if (typingIndicatorContainer.parentNode === chatBox) chatBox.appendChild(typingIndicatorContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
            localStorage.setItem("hidden_sys_" + msgKey, "true"); 
            setTimeout(() => {
                msgDiv.style.transition = "opacity 1.5s ease, transform 1.5s ease";
                msgDiv.style.opacity = "0"; msgDiv.style.transform = "scale(0.9)";
                setTimeout(() => { if (msgDiv.parentNode) msgDiv.remove(); }, 1500);
            }, 60000); 
            return;
        }
    }

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
    
    if (rawName === "umaedi") sender.innerHTML += `<span class="tag-founder">👑 FOUNDER</span>`;
    else if (coreMembers.includes(rawName)) sender.innerHTML += `<span class="tag-core">⭐ CORE TEAM</span>`;
    
    headerDiv.append(avatar, sender);

    const contentDiv = document.createElement("div");
    contentDiv.className = "msg-content";

    if (data.replyTo) {
        const replyDiv = document.createElement("div");
        replyDiv.className = "msg-reply-box";
        replyDiv.innerHTML = `<strong>${data.replyTo.name}</strong><p>${data.replyTo.text}</p>`;
        contentDiv.appendChild(replyDiv);
    }
    
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

    // RENDER AUDIO (Jika ada)
    if (data.audio) {
        const audioEl = document.createElement("audio");
        audioEl.controls = true;
        audioEl.src = data.audio;
        audioEl.style.marginTop = data.message ? "8px" : "0";
        audioEl.style.width = "220px";
        audioEl.style.height = "35px";
        audioEl.style.outline = "none";
        
        // Custom styling audio bawaan browser agar agak nyambung warnanya (Hack ringan)
        audioEl.style.filter = "sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)";
        
        contentDiv.appendChild(audioEl);
    }

    msgDiv.append(headerDiv, contentDiv);
    chatBox.appendChild(msgDiv);
    
    if (typingIndicatorContainer.parentNode === chatBox) chatBox.appendChild(typingIndicatorContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    localStorage.setItem("lastRead_" + currentRoom, Date.now());

    let startX = 0; let startY = 0; let isSwiping = false;

    msgDiv.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        isSwiping = true; msgDiv.style.transition = 'none'; 
    }, {passive: true});

    msgDiv.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        let currentX = e.touches[0].clientX; let currentY = e.touches[0].clientY;
        let diffX = currentX - startX; let diffY = Math.abs(currentY - startY);
        
        if (diffY > Math.abs(diffX) && diffX < 15) {
            isSwiping = false; msgDiv.style.transform = `translateX(0px)`; return;
        }

        if (diffX > 0 && diffX < 60) { msgDiv.style.transform = `translateX(${diffX}px)`; }
    }, {passive: true});

    msgDiv.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        let endX = e.changedTouches[0].clientX; let diffX = endX - startX;
        msgDiv.style.transition = 'transform 0.2s ease-out';
        msgDiv.style.transform = `translateX(0px)`; 
        if (diffX > 40) { 
            let repText = data.image ? "📷 Gambar/Foto" : (data.audio ? "🎤 Voice Note" : data.message);
            triggerReply(displayName, repText);
        }
        isSwiping = false;
    });

    msgDiv.addEventListener('dblclick', () => {
        let repText = data.image ? "📷 Gambar/Foto" : (data.audio ? "🎤 Voice Note" : data.message);
        triggerReply(displayName, repText);
    });
}

function sendMessage() {
    if (!chatInput || !currentRoom) return;
    const dbRefName = currentRoom === "core" ? "messages" : "messages_public";
    const chatRef = ref(db, dbRefName);
    const text = chatInput.value.trim();
    if (text !== "" && currentUser) {
        let payload = { name: currentUser, message: text, timestamp: Date.now() };
        if (activeReplyData) payload.replyTo = activeReplyData;
        
        push(chatRef, payload);
        chatInput.value = ""; 
        cancelReply(); 
        
        set(ref(db, `typing_${currentRoom}/${currentUser}`), null);
    }
}

setLoginState(currentUser);

if(chatInput) {
    chatInput.addEventListener("input", () => {
        if (!currentRoom || !currentUser) return;
        const typingRef = ref(db, `typing_${currentRoom}/${currentUser}`);
        
        if (chatInput.value.trim().length > 0) {
            set(typingRef, true); 
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => { set(typingRef, null); }, 3000);
        } else {
            set(typingRef, null); 
        }
    });

    chatInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter") sendMessage(); 
    });
}

if(sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}