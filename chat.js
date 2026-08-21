// Mengimpor sistem Firebase secara langsung (Modern ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const chatRef = ref(db, "messages");

// Mengambil elemen dari HTML
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const loginPanel = document.getElementById("loginPanel");
const loginUser = document.getElementById("loginUser");
const loginCode = document.getElementById("loginCode");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const accountBar = document.getElementById("accountBar");
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");

const accountCodes = {
    Umaedi: "UMAEDI2026",
    Iqbal: "IQBAL2026",
    Rifki: "RIFKI2026",
    Fasya: "FASYA2026"
};
const sessionKey = "nihongoChatUser";
let currentUser = sessionStorage.getItem(sessionKey);
const pendingMessages = [];

function setLoginState(user) {
    currentUser = user;
    if (user) {
        sessionStorage.setItem(sessionKey, user);
        loginPanel.hidden = true;
        accountBar.hidden = false;
        currentUserLabel.textContent = user;
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatBox.replaceChildren();
        pendingMessages.forEach(renderMessage);
        chatInput.focus();
    } else {
        sessionStorage.removeItem(sessionKey);
        loginPanel.hidden = false;
        accountBar.hidden = true;
        chatInput.disabled = true;
        sendBtn.disabled = true;
        chatBox.replaceChildren();
    }
}

function renderMessage(data) {
    if (!currentUser) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${data.name === currentUser ? "is-own" : "is-other"}`;

    const sender = document.createElement("strong");
    sender.textContent = data.name;
    const message = document.createElement("span");
    message.textContent = data.message;
    msgDiv.append(sender, message);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi mengirim pesan ke Database
function sendMessage() {
    const text = chatInput.value.trim();

    if (text !== "" && currentUser) {
        push(chatRef, {
            name: currentUser,
            message: text,
            timestamp: Date.now()
        });
        chatInput.value = ""; // Kosongkan input setelah kirim
    }
}

// Mendengarkan pesan baru dari Database (Real-time)
onChildAdded(chatRef, (snapshot) => {
    const data = snapshot.val();
    pendingMessages.push(data);
    renderMessage(data);
});

loginBtn.addEventListener("click", () => {
    const user = loginUser.value;
    const code = loginCode.value.trim().toUpperCase();
    if (accountCodes[user] === code) {
        loginError.textContent = "";
        loginCode.value = "";
        setLoginState(user);
    } else {
        loginError.textContent = "Akun atau kode rahasia salah.";
    }
});

loginCode.addEventListener("keypress", (event) => {
    if (event.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => setLoginState(null));
setLoginState(accountCodes[currentUser] ? currentUser : null);

// Event Listener untuk Tombol Kirim dan Enter
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});
