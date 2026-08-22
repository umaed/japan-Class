import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, query, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const announceRef = ref(db, "announcements");

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

// ==========================================
// MENDETEKSI AKUN YANG LOGIN (INI YANG SEBELUMNYA TERLEWAT)
// ==========================================
const currentUser = localStorage.getItem("nihongoChatUser");

// ==========================================
// 1. LOGIKA KHUSUS UMAEDI (GOD MODE)
// ==========================================
if (currentUser === "Umaedi" && adminToggleBtn) {
    adminToggleBtn.style.display = "block"; 
}

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
        } else {
            alert("Pesan tidak boleh kosong!");
        }
    });
}

// ==========================================
// 2. PENERIMA PESAN BROADCAST (POP-UP)
// ==========================================
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
            
            alertSound.play().catch(e => console.log("Mute otomatis oleh browser"));
            
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
// 3. LOGIKA LEADERBOARD (RANKING REAL-TIME)
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
                const medal = medals[index] || "🌱 Level: Novice";
                const rankClass = `rank-${index + 1 > 4 ? 4 : index + 1}`;
                
                const imgName = user.name.toLowerCase();
                const imagePath = `gambar/${imgName}.png`;
                const initial = user.name.charAt(0).toUpperCase();
                
                const li = document.createElement("li");
                li.className = rankClass;
                li.innerHTML = `
                    <div class="rank-pic" style="background: rgba(255,255,255,0.05); display: grid; place-items: center; overflow: hidden; border-radius: 50%;">
                        <img src="${imagePath}" alt="${initial}" 
                             style="width: 100%; height: 100%; object-fit: cover; background-color: #fff;" 
                             onerror="this.style.display='none'; this.parentNode.innerHTML='<span style=\\'color:#fff; font-size:20px; font-weight:bold; font-family:Noto Serif JP, serif;\\'>${initial}</span>';">
                    </div>
                    <div class="rank-info" style="flex: 1;">
                        <strong>${user.name === "Rifki" ? "Rifki (Swing)" : user.name}</strong>
                        <p>${medal}</p>
                    </div>
                    <div style="font-size: 1.3rem; font-weight: 700; color: var(--japan-gold); font-family: 'Montserrat', sans-serif;">
                        ${user.score}
                    </div>
                `;
                leaderboardList.appendChild(li);
            });
        } else {
            leaderboardList.innerHTML = `<li style="text-align:center; justify-content:center; color: var(--muted);">Belum ada data skor. Mainkan kuis!</li>`;
        }
    }, (error) => {
        console.error("Firebase Error:", error);
        leaderboardList.innerHTML = `<li style="text-align:center; justify-content:center; color: #D32F2F;">Akses Ditolak (Cek Rules Firebase)</li>`;
    });
}

// ==========================================
// 4. NOTIFIKASI PESAN BELUM DIBACA (GLOBAL)
// ==========================================
const msgBadge = document.getElementById("msgBadge");
const chatMessagesRef = ref(db, "messages");

// Sekarang blok ini akan berjalan karena currentUser sudah terdeteksi!
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
                if (msg.timestamp > lastRead && msg.name !== currentUser) {
                    unreadCount++;
                }
            });
            
            if (unreadCount > 0) {
                msgBadge.innerText = unreadCount > 9 ? "9+" : unreadCount;
                msgBadge.style.display = "grid";
            } else {
                msgBadge.style.display = "none";
            }
        }
    });
}