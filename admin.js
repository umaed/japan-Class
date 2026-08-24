import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, query, limitToLast, onValue, set, get, child, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const announceRef = ref(db, "announcements");

const currentUser = localStorage.getItem("nihongoChatUser");

// ==========================================
// 1. SISTEM LOGIN & REGISTER
// ==========================================
const globalLoginOverlay = document.getElementById("globalLoginOverlay");
if (globalLoginOverlay) {
    const guestPromptPopup = document.getElementById("guestPromptPopup");
    const topLoginToggle = document.getElementById("topLoginToggle");
    const closeLoginModal = document.getElementById("closeLoginModal");
    
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");

    if (showRegisterBtn && showLoginBtn) {
        showRegisterBtn.addEventListener("click", () => {
            loginForm.style.display = "none";
            registerForm.style.display = "block";
            modalTitle.textContent = "Buat Akun Baru";
            modalDesc.textContent = "Daftarkan dirimu untuk bergabung dengan Trinity.";
        });
        showLoginBtn.addEventListener("click", () => {
            registerForm.style.display = "none";
            loginForm.style.display = "block";
            modalTitle.textContent = "Identifikasi Member";
            modalDesc.textContent = "Silakan masuk untuk mengakses pusat kontrol.";
        });
    }

    const isGuestPromptDismissed = localStorage.getItem("guestPromptDismissed"); 
    if (!currentUser && !isGuestPromptDismissed && guestPromptPopup) guestPromptPopup.style.display = "flex";

    const btnPromptNanti = document.getElementById("btnPromptNanti");
    if (btnPromptNanti) btnPromptNanti.addEventListener("click", () => {
        guestPromptPopup.style.display = "none";
        localStorage.setItem("guestPromptDismissed", "true"); 
    });

    const btnPromptLogin = document.getElementById("btnPromptLogin");
    if (btnPromptLogin) btnPromptLogin.addEventListener("click", () => {
        guestPromptPopup.style.display = "none";
        globalLoginOverlay.style.display = "flex"; 
        localStorage.setItem("guestPromptDismissed", "true"); 
    });

    if (topLoginToggle) {
        topLoginToggle.addEventListener("click", () => {
            if (currentUser) document.getElementById("profileModalOverlay").style.display = "flex";
            else {
                globalLoginOverlay.style.display = "flex";
                if(guestPromptPopup) guestPromptPopup.style.display = "none";
            }
        });
    }

    if (closeLoginModal) closeLoginModal.addEventListener("click", () => globalLoginOverlay.style.display = "none");

    const mainRegBtn = document.getElementById("mainRegBtn");
    if (mainRegBtn) {
        const processReg = async () => {
            const userRaw = document.getElementById("regUsername").value.trim();
            const searchUser = userRaw.toLowerCase().replace(/\s+/g, '');
            const email = document.getElementById("regEmail").value.trim();
            const pass = document.getElementById("regPassword").value.trim();
            const regError = document.getElementById("regError");
            
            if (!userRaw || !email || !pass) { regError.textContent = "Semua kolom wajib diisi!"; return; }
            if (searchUser.length < 3) { regError.textContent = "Username minimal 3 huruf!"; return; }
            
            mainRegBtn.textContent = "MEMPROSES...";
            try {
                const snapshot = await get(child(ref(db), `accounts/${searchUser}`));
                if (snapshot.exists()) {
                    regError.textContent = "Maaf, nama akun ini sudah dipakai!";
                    mainRegBtn.textContent = "DAFTAR SEKARANG";
                } else {
                    await set(ref(db, `accounts/${searchUser}`), { email: email, password: pass, originalName: userRaw });
                    await set(ref(db, `user_profiles/${userRaw}`), { displayName: userRaw, photoBase64: "" });
                    localStorage.setItem("nihongoChatUser", userRaw);
                    window.location.reload(); 
                }
            } catch(e) {
                regError.textContent = "Gagal menghubungi database server.";
                mainRegBtn.textContent = "DAFTAR SEKARANG";
            }
        };
        mainRegBtn.addEventListener("click", processReg);
        document.getElementById("regPassword").addEventListener("keypress", (e) => { if (e.key === "Enter") processReg(); });
    }

    const mainLoginBtn = document.getElementById("mainLoginBtn");
    if (mainLoginBtn) {
        const processLogin = async () => {
            const userRaw = document.getElementById("loginUsername").value.trim();
            const pass = document.getElementById("loginPassword").value.trim();
            const searchUser = userRaw.toLowerCase().replace(/\s+/g, '');
            const loginError = document.getElementById("loginError");
            
            if (!userRaw || !pass) { loginError.textContent = "Isi nama dan sandi Anda."; return; }

            mainLoginBtn.textContent = "MEMERIKSA...";
            try {
                const snapshot = await get(child(ref(db), `accounts/${searchUser}`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.password === pass) {
                        localStorage.setItem("nihongoChatUser", data.originalName || userRaw);
                        window.location.reload();
                    } else {
                        loginError.textContent = "Kata sandi salah!";
                        mainLoginBtn.textContent = "MASUK";
                    }
                } else {
                    const accountCodes = { "Umaedi": "UMAEDI2026", "Iqbal": "IQBAL2026", "Rifki": "RIFKI2026", "Fasya": "FASYA2026" };
                    const foundUser = Object.keys(accountCodes).find(k => k.toLowerCase() === searchUser);
                    
                    if (foundUser && accountCodes[foundUser] === pass.toUpperCase()) {
                        localStorage.setItem("nihongoChatUser", foundUser);
                        window.location.reload();
                    } else {
                        loginError.textContent = "Akun tidak ditemukan atau sandi salah.";
                        mainLoginBtn.textContent = "MASUK";
                    }
                }
            } catch(e) {
                loginError.textContent = "Gagal menghubungi server.";
                mainLoginBtn.textContent = "MASUK";
            }
        };
        mainLoginBtn.addEventListener("click", processLogin);
        document.getElementById("loginPassword").addEventListener("keypress", (e) => { if (e.key === "Enter") processLogin(); });
    }
}

// ==========================================
// 2. SISTEM PROFIL GLOBAL
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

const closeProfileModal = document.getElementById("closeProfileModal");
if (closeProfileModal) closeProfileModal.addEventListener("click", () => document.getElementById("profileModalOverlay").style.display = "none");

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", () => { localStorage.removeItem("nihongoChatUser"); window.location.reload(); });

// ==========================================
// 3. ADMIN OVERRIDE & PEMBERSIH CHAT BOT
// ==========================================
const adminToggleBtn = document.getElementById("adminToggleBtn");
const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");
const announceTitle = document.getElementById("announceTitle");
const announceMessage = document.getElementById("announceMessage");
const sendAnnounceBtn = document.getElementById("sendAnnounceBtn");
const clearPublicBtn = document.getElementById("clearPublicBtn");
const clearCoreBtn = document.getElementById("clearCoreBtn");

if (currentUser === "Umaedi" && adminToggleBtn) adminToggleBtn.style.display = "block"; 

// Layar Pengunci Khusus Admin (Mencegah admin kabur saat proses pembersihan berlangsung)
function showAdminWipeOverlay() {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:monospace; text-align:center; padding:20px; backdrop-filter:blur(10px);";
    overlay.innerHTML = `
        <div style="font-size:50px; margin-bottom:20px;">⚠️</div>
        <h2 style="color:#ff3b30; margin:0 0 10px; font-size:1.5rem;">SYSTEM OVERRIDE IN PROGRESS</h2>
        <p style="color:#E2E8F0; margin-bottom:20px;">Menyusup ke database dan memusnahkan riwayat obrolan...</p>
        <h1 id="adminCountdown" style="font-size:5rem; margin:0; color:#D4AF37;">10</h1>
        <p style="color:#ff3b30; margin-top:30px; font-weight:bold; max-width:80%; line-height:1.5;">MOHON JANGAN TUTUP ATAU PINDAH HALAMAN INI SELAMA PROSES BERLANGSUNG!</p>
    `;
    document.body.appendChild(overlay);

    let c = 10;
    const cInt = setInterval(() => {
        c--;
        const counter = document.getElementById("adminCountdown");
        if(counter) counter.innerText = c;
        if(c <= 0) clearInterval(cInt);
    }, 1000);

    return overlay;
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
        } else alert("Pesan tidak boleh kosong!");
    });
    
    // PEMICU BOT PEMBERSIH PUBLIC LOUNGE
    if (clearPublicBtn) {
        clearPublicBtn.addEventListener("click", () => {
            if (confirm("YAKIN HAPUS PUBLIC LOUNGE? Bot akan menyusup dan memulai hitung mundur 10 detik di layar semua orang.")) {
                adminModal.style.display = "none";
                const dbRef = ref(db, "messages_public");
                
                const overlay = showAdminWipeOverlay(); // Kunci Layar Umaedi
                
                // Memicu Bot Hacker Masuk
                push(dbRef, { 
                    name: "SYSTEM", 
                    message: "Pesan di ruang obrolan ini akan dihapus oleh admin dalam hitung mundur", 
                    isCountdown: true, 
                    timestamp: Date.now() 
                });
                
                // Eksekutor Penghapus Database (Jeda 10.5 Detik agar pas)
                setTimeout(async () => {
                    await remove(dbRef); // Membakar habis database
                    await push(dbRef, {
                        name: "SYSTEM",
                        message: "Ruang obrolan telah dibersihkan secara permanen oleh Admin.",
                        isPostClear: true,
                        timestamp: Date.now()
                    });
                    if(document.body.contains(overlay)) document.body.removeChild(overlay);
                }, 10500);
            }
        });
    }

    // PEMICU BOT PEMBERSIH TRINITY CORE
    if (clearCoreBtn) {
        clearCoreBtn.addEventListener("click", () => {
            if (confirm("YAKIN HAPUS TRINITY CORE? Bot akan menyusup dan memulai hitung mundur 10 detik.")) {
                adminModal.style.display = "none";
                const dbRef = ref(db, "messages");

                const overlay = showAdminWipeOverlay();

                push(dbRef, { 
                    name: "SYSTEM", 
                    message: "Pesan di ruang obrolan ini akan dihapus oleh admin dalam hitung mundur", 
                    isCountdown: true, 
                    timestamp: Date.now() 
                });

                setTimeout(async () => {
                    await remove(dbRef);
                    await push(dbRef, {
                        name: "SYSTEM",
                        message: "Ruang rahasia Trinity Core telah aman dan dibersihkan dari jejak.",
                        isPostClear: true,
                        timestamp: Date.now()
                    });
                    if(document.body.contains(overlay)) document.body.removeChild(overlay);
                }, 10500);
            }
        });
    }
}

// Global Pop-Up Alert Broadcast
const globalAlert = document.getElementById("globalAlert");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");
const closeAlert = document.getElementById("closeAlert");
const alertSound = new Audio('https://actions.google.com/sounds/v1/alarms/message_alert_sound.ogg');

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
                setTimeout(() => { globalAlert.style.display = "none"; globalAlert.classList.remove("hide-alert"); }, 500); 
            }, 5000);
        }
    }
});

if (closeAlert) closeAlert.addEventListener("click", () => {
    clearTimeout(hideTimeout);
    globalAlert.classList.add("hide-alert");
    setTimeout(() => { globalAlert.style.display = "none"; globalAlert.classList.remove("hide-alert"); }, 500);
});

// ==========================================
// 4. LOGIKA LEADERBOARD
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
// 5. NOTIFIKASI PESAN BELUM DIBACA
// ==========================================
const msgBadge = document.getElementById("msgBadge");
const chatMessagesRef = ref(db, "messages");

if (currentUser && msgBadge) {
    const coreMembers = ["umaedi", "iqbal", "rifki", "fasya"];
    const isCore = coreMembers.includes(currentUser.toLowerCase());
    
    const checkUnread = (roomName) => {
        const refName = roomName === "core" ? "messages" : "messages_public";
        const recentMessages = query(ref(db, refName), limitToLast(30));
        
        onValue(recentMessages, (snapshot) => {
            if (snapshot.exists()) {
                let unreadCount = 0;
                let lastRead = Number(localStorage.getItem("lastRead_" + roomName));
                
                if (!lastRead && roomName === "core") {
                    lastRead = Number(localStorage.getItem("lastReadMessageTime")) || Date.now();
                    localStorage.setItem("lastRead_" + roomName, lastRead);
                } else if (!lastRead) {
                    lastRead = Date.now();
                    localStorage.setItem("lastRead_" + roomName, lastRead);
                }

                snapshot.forEach((childSnap) => {
                    const msg = childSnap.val();
                    if (msg.timestamp > lastRead && msg.name !== currentUser && msg.name !== "SYSTEM") unreadCount++;
                });
                
                window["unread_" + roomName] = unreadCount;
                updateTotalBadge();
            }
        });
    };

    const updateTotalBadge = () => {
        let total = (window.unread_public || 0);
        if (isCore) total += (window.unread_core || 0); 
        
        if (total > 0) {
            msgBadge.innerText = total > 9 ? "9+" : total;
            msgBadge.style.display = "grid";
        } else msgBadge.style.display = "none";
    };

    checkUnread("public");
    if (isCore) checkUnread("core");
}