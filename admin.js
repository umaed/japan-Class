import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, query, limitToLast, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const announceRef = ref(db, "announcements");

const currentUser = localStorage.getItem("nihongoChatUser");

// ==========================================
// SISTEM PROFIL GLOBAL & UPLOAD FOTO
// ==========================================
window.userProfiles = {}; 
const profilesRef = ref(db, 'user_profiles');

onValue(profilesRef, (snapshot) => {
    if(snapshot.exists()) {
        window.userProfiles = snapshot.val();
        
        if(currentUser) {
            const myProfile = window.userProfiles[currentUser] || {};
            const topText = document.getElementById("topLoginText");
            const topAvatar = document.getElementById("topAvatar");
            const topIcon = document.getElementById("topIcon");
            
            const isPages = window.location.pathname.includes('/pages/');
            const basePath = isPages ? `../gambar/${currentUser.toLowerCase()}.png` : `gambar/${currentUser.toLowerCase()}.png`;
            const finalPhoto = myProfile.photoBase64 || basePath;

            if(topText) topText.textContent = myProfile.displayName || currentUser;
            if(topAvatar && topIcon) {
                topAvatar.src = finalPhoto;
                topAvatar.style.display = "block";
                topIcon.style.display = "none";
            }

            const profilePreviewImg = document.getElementById("profilePreviewImg");
            const profileNameInput = document.getElementById("profileNameInput");
            if(profilePreviewImg && !window.newPhotoBase64) profilePreviewImg.src = finalPhoto;
            if(profileNameInput && !profileNameInput.value) profileNameInput.value = myProfile.displayName || currentUser;
        }
        window.dispatchEvent(new Event('profilesUpdated'));
    }
});

window.newPhotoBase64 = null;
const profileImageUpload = document.getElementById("profileImageUpload");
if(profileImageUpload) {
    profileImageUpload.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const size = 150; 
                canvas.width = size; canvas.height = size;
                const minRatio = Math.min(img.width, img.height);
                const sx = (img.width - minRatio) / 2;
                const sy = (img.height - minRatio) / 2;
                ctx.drawImage(img, sx, sy, minRatio, minRatio, 0, 0, size, size);
                
                window.newPhotoBase64 = canvas.toDataURL("image/jpeg", 0.7);
                document.getElementById("profilePreviewImg").src = window.newPhotoBase64;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const saveProfileBtn = document.getElementById("saveProfileBtn");
if(saveProfileBtn && currentUser) {
    saveProfileBtn.addEventListener("click", () => {
        saveProfileBtn.textContent = "MENYIMPAN...";
        const newName = document.getElementById("profileNameInput").value.trim() || currentUser;
        const profileData = {
            displayName: newName,
            photoBase64: window.newPhotoBase64 || (window.userProfiles[currentUser]?.photoBase64 || "")
        };
        
        set(ref(db, 'user_profiles/' + currentUser), profileData).then(() => {
            saveProfileBtn.textContent = "SIMPAN PERUBAHAN";
            document.getElementById("profileModalOverlay").style.display = "none";
        });
    });
}

// ==========================================
// ADMIN OVERRIDE & BROADCAST
// ==========================================
const adminToggleBtn = document.getElementById("adminToggleBtn");
const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");
const announceTitle = document.getElementById("announceTitle");
const announceMessage = document.getElementById("announceMessage");
const sendAnnounceBtn = document.getElementById("sendAnnounceBtn");
const globalAlert = document.getElementById("globalAlert");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");
const closeAlert = document.getElementById("closeAlert");
const alertSound = new Audio('https://actions.google.com/sounds/v1/alarms/message_alert_sound.ogg');

if (currentUser === "Umaedi" && adminToggleBtn) adminToggleBtn.style.display = "block"; 

if (adminToggleBtn && adminModal) {
    adminToggleBtn.addEventListener("click", () => adminModal.style.display = "flex");
    closeAdminModal.addEventListener("click", () => adminModal.style.display = "none");
    
    sendAnnounceBtn.addEventListener("click", () => {
        const title = announceTitle.value.trim() || "PENGUMUMAN SISTEM";
        const message = announceMessage.value.trim();
        if (message !== "") {
            push(announceRef, { title, message, timestamp: Date.now(), sender: "Umaedi" });
            adminModal.style.display = "none";
            announceTitle.value = ""; announceMessage.value = "";
        } else alert("Pesan tidak boleh kosong!");
    });
}

const recentAnnouncements = query(announceRef, limitToLast(1));
let lastSeenId = localStorage.getItem("lastSeenAnnounce");
let hideTimeout; 

onChildAdded(recentAnnouncements, (snapshot) => {
    const data = snapshot.val();
    const key = snapshot.key;
    if (lastSeenId !== key) {
        if (alertTitle && alertMessage && globalAlert) {
            globalAlert.classList.remove("hide-alert");
            alertTitle.textContent = data.title;
            alertMessage.textContent = data.message;
            globalAlert.style.display = "block";
            alertSound.play().catch(e => console.log("Mute otomatis"));
            
            localStorage.setItem("lastSeenAnnounce", key);
            lastSeenId = key;
            
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                globalAlert.classList.add("hide-alert");
                setTimeout(() => {
                    globalAlert.style.display = "none";
                    globalAlert.classList.remove("hide-alert");
                }, 500); 
            }, 5000);
        }
    }
});

if (closeAlert) {
    closeAlert.addEventListener("click", () => {
        clearTimeout(hideTimeout);
        globalAlert.classList.add("hide-alert");
        setTimeout(() => {
            globalAlert.style.display = "none";
            globalAlert.classList.remove("hide-alert");
        }, 500);
    });
}

// ==========================================
// LOGIKA LEADERBOARD
// ==========================================
const leaderboardRef = ref(db, "leaderboard");
const leaderboardList = document.getElementById("leaderboardList");

if (leaderboardList) {
    onValue(leaderboardRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const ranks = [];
            for (let key in data) { ranks.push({ name: key, score: data[key] }); }
            ranks.sort((a, b) => b.score - a.score);
            
            leaderboardList.innerHTML = "";
            const medals = ["👑 Level: Sensei", "💻 Level: Senpai", "📜 Level: Kouhai", "🌱 Level: Novice"];
            
            ranks.forEach((user, index) => {
                const profile = window.userProfiles ? (window.userProfiles[user.name] || {}) : {};
                const medal = medals[index] || "🌱 Level: Novice";
                const rankClass = `rank-${index + 1 > 4 ? 4 : index + 1}`;
                
                const displayName = profile.displayName || (user.name === "Rifki" ? "Rifki (Swing)" : user.name);
                const isPages = window.location.pathname.includes('/pages/');
                const basePath = isPages ? `../gambar/${user.name.toLowerCase()}.png` : `gambar/${user.name.toLowerCase()}.png`;
                const finalPhoto = profile.photoBase64 || basePath;
                const initial = displayName.charAt(0).toUpperCase();
                
                const li = document.createElement("li");
                li.className = rankClass;
                li.innerHTML = `
                    <div class="rank-pic" style="background: rgba(255,255,255,0.05); display: grid; place-items: center; overflow: hidden; border-radius: 50%;">
                        <img src="${finalPhoto}" alt="${initial}" 
                             style="width: 100%; height: 100%; object-fit: cover; background-color: #fff;" 
                             onerror="this.style.display='none'; this.parentNode.innerHTML='<span style=\\'color:#fff; font-size:20px; font-weight:bold; font-family:Noto Serif JP, serif;\\'>${initial}</span>';">
                    </div>
                    <div class="rank-info" style="flex: 1;">
                        <strong>${displayName}</strong>
                        <p>${medal}</p>
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: var(--japan-gold); font-family: 'Montserrat', sans-serif;">
                        ${user.score}
                    </div>
                `;
                leaderboardList.appendChild(li);
            });
        }
    });
}

// ==========================================
// NOTIFIKASI PESAN BELUM DIBACA
// ==========================================
const msgBadge = document.getElementById("msgBadge");
const chatMessagesRef = ref(db, "messages");

if (currentUser && msgBadge) {
    const recentMessages = query(chatMessagesRef, limitToLast(30));
    onValue(recentMessages, (snapshot) => {
        if (snapshot.exists()) {
            let unreadCount = 0;
            let lastRead = Number(localStorage.getItem("lastReadMessageTime"));
            if (!lastRead) {
                lastRead = Date.now();
                localStorage.setItem("lastReadMessageTime", lastRead);
            }
            snapshot.forEach((childSnap) => {
                const msg = childSnap.val();
                if (msg.timestamp > lastRead && msg.name !== currentUser) unreadCount++;
            });
            if (unreadCount > 0) {
                msgBadge.innerText = unreadCount > 9 ? "9+" : unreadCount;
                msgBadge.style.display = "grid";
            } else msgBadge.style.display = "none";
        }
    });
}