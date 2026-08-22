// Database Gabungan Hiragana & Katakana
const kanaList = [
    // --- HIRAGANA ---
    { kana: "あ", romaji: "a", type: "HIRAGANA" }, { kana: "い", romaji: "i", type: "HIRAGANA" }, { kana: "う", romaji: "u", type: "HIRAGANA" }, { kana: "え", romaji: "e", type: "HIRAGANA" }, { kana: "お", romaji: "o", type: "HIRAGANA" },
    { kana: "か", romaji: "ka", type: "HIRAGANA" }, { kana: "き", romaji: "ki", type: "HIRAGANA" }, { kana: "く", romaji: "ku", type: "HIRAGANA" }, { kana: "け", romaji: "ke", type: "HIRAGANA" }, { kana: "こ", romaji: "ko", type: "HIRAGANA" },
    { kana: "さ", romaji: "sa", type: "HIRAGANA" }, { kana: "し", romaji: "shi", type: "HIRAGANA" }, { kana: "す", romaji: "su", type: "HIRAGANA" }, { kana: "せ", romaji: "se", type: "HIRAGANA" }, { kana: "そ", romaji: "so", type: "HIRAGANA" },
    { kana: "た", romaji: "ta", type: "HIRAGANA" }, { kana: "ち", romaji: "chi", type: "HIRAGANA" }, { kana: "つ", romaji: "tsu", type: "HIRAGANA" }, { kana: "て", romaji: "te", type: "HIRAGANA" }, { kana: "と", romaji: "to", type: "HIRAGANA" },
    { kana: "な", romaji: "na", type: "HIRAGANA" }, { kana: "に", romaji: "ni", type: "HIRAGANA" }, { kana: "ぬ", romaji: "nu", type: "HIRAGANA" }, { kana: "ね", romaji: "ne", type: "HIRAGANA" }, { kana: "の", romaji: "no", type: "HIRAGANA" },
    { kana: "は", romaji: "ha", type: "HIRAGANA" }, { kana: "ひ", romaji: "hi", type: "HIRAGANA" }, { kana: "ふ", romaji: "fu", type: "HIRAGANA" }, { kana: "へ", romaji: "he", type: "HIRAGANA" }, { kana: "ほ", romaji: "ho", type: "HIRAGANA" },
    { kana: "ま", romaji: "ma", type: "HIRAGANA" }, { kana: "み", romaji: "mi", type: "HIRAGANA" }, { kana: "む", romaji: "mu", type: "HIRAGANA" }, { kana: "め", romaji: "me", type: "HIRAGANA" }, { kana: "も", romaji: "mo", type: "HIRAGANA" },
    { kana: "や", romaji: "ya", type: "HIRAGANA" }, { kana: "ゆ", romaji: "yu", type: "HIRAGANA" }, { kana: "よ", romaji: "yo", type: "HIRAGANA" },
    { kana: "ら", romaji: "ra", type: "HIRAGANA" }, { kana: "り", romaji: "ri", type: "HIRAGANA" }, { kana: "る", romaji: "ru", type: "HIRAGANA" }, { kana: "れ", romaji: "re", type: "HIRAGANA" }, { kana: "ろ", romaji: "ro", type: "HIRAGANA" },
    { kana: "わ", romaji: "wa", type: "HIRAGANA" }, { kana: "を", romaji: "wo", type: "HIRAGANA" }, { kana: "ん", romaji: "n", type: "HIRAGANA" },
    
    // --- KATAKANA ---
    { kana: "ア", romaji: "a", type: "KATAKANA" }, { kana: "イ", romaji: "i", type: "KATAKANA" }, { kana: "ウ", romaji: "u", type: "KATAKANA" }, { kana: "エ", romaji: "e", type: "KATAKANA" }, { kana: "オ", romaji: "o", type: "KATAKANA" },
    { kana: "カ", romaji: "ka", type: "KATAKANA" }, { kana: "キ", romaji: "ki", type: "KATAKANA" }, { kana: "ク", romaji: "ku", type: "KATAKANA" }, { kana: "ケ", romaji: "ke", type: "KATAKANA" }, { kana: "コ", romaji: "ko", type: "KATAKANA" },
    { kana: "サ", romaji: "sa", type: "KATAKANA" }, { kana: "シ", romaji: "shi", type: "KATAKANA" }, { kana: "ス", romaji: "su", type: "KATAKANA" }, { kana: "セ", romaji: "se", type: "KATAKANA" }, { kana: "ソ", romaji: "so", type: "KATAKANA" },
    { kana: "タ", romaji: "ta", type: "KATAKANA" }, { kana: "チ", romaji: "chi", type: "KATAKANA" }, { kana: "ツ", romaji: "tsu", type: "KATAKANA" }, { kana: "テ", romaji: "te", type: "KATAKANA" }, { kana: "ト", romaji: "to", type: "KATAKANA" },
    { kana: "ナ", romaji: "na", type: "KATAKANA" }, { kana: "ニ", romaji: "ni", type: "KATAKANA" }, { kana: "ヌ", romaji: "nu", type: "KATAKANA" }, { kana: "ネ", romaji: "ne", type: "KATAKANA" }, { kana: "ノ", romaji: "no", type: "KATAKANA" },
    { kana: "ハ", romaji: "ha", type: "KATAKANA" }, { kana: "ヒ", romaji: "hi", type: "KATAKANA" }, { kana: "フ", romaji: "fu", type: "KATAKANA" }, { kana: "ヘ", romaji: "he", type: "KATAKANA" }, { kana: "ホ", romaji: "ho", type: "KATAKANA" },
    { kana: "マ", romaji: "ma", type: "KATAKANA" }, { kana: "ミ", romaji: "mi", type: "KATAKANA" }, { kana: "ム", romaji: "mu", type: "KATAKANA" }, { kana: "メ", romaji: "me", type: "KATAKANA" }, { kana: "モ", romaji: "mo", type: "KATAKANA" },
    { kana: "ヤ", romaji: "ya", type: "KATAKANA" }, { kana: "ユ", romaji: "yu", type: "KATAKANA" }, { kana: "ヨ", romaji: "yo", type: "KATAKANA" },
    { kana: "ラ", romaji: "ra", type: "KATAKANA" }, { kana: "リ", romaji: "ri", type: "KATAKANA" }, { kana: "ル", romaji: "ru", type: "KATAKANA" }, { kana: "レ", romaji: "re", type: "KATAKANA" }, { kana: "ロ", romaji: "ro", type: "KATAKANA" },
    { kana: "ワ", romaji: "wa", type: "KATAKANA" }, { kana: "ヲ", romaji: "wo", type: "KATAKANA" }, { kana: "ン", romaji: "n", type: "KATAKANA" }
];

let currentScore = 0;
let currentStreak = 0;
let bestScore = Number(localStorage.getItem("nihongoBestScore") || 0);
let currentQuestion = {};

function setupInfoProfile() {
    const profile = document.getElementById("developerProfile");
    const message = document.getElementById("developerMessage");
    if (!profile || !message) return;

    profile.addEventListener("click", () => {
        const isOpen = profile.getAttribute("aria-expanded") === "true";
        profile.setAttribute("aria-expanded", String(!isOpen));
        message.classList.toggle("is-hidden", isOpen);
        message.setAttribute("aria-hidden", String(isOpen));

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            if (!isOpen) {
                const speech = new SpeechSynthesisUtterance(message.querySelector("p").innerText);
                speech.lang = "id-ID";
                speech.rate = 0.95;
                speech.pitch = 1;
                window.speechSynthesis.speak(speech);
            }
        }
    });
}

function setupStudyPage() {
    const studyPage = document.querySelector(".study-page");
    if (!studyPage) return;

    const kanaType = studyPage.dataset.kanaType;
    const storageKey = `nihongoLearned${kanaType}`;
    const learned = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    const cards = [...document.querySelectorAll(".kana-box")].filter(card => card.querySelector("span"));
    const search = document.getElementById("kanaSearch");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");

    function updateProgress() {
        const amount = learned.size;
        progressText.innerText = `${amount} / ${cards.length}`;
        progressBar.style.width = `${(amount / cards.length) * 100}%`;
        cards.forEach(card => card.classList.toggle("is-learned", learned.has(card.querySelector("span").innerText)));
    }

    cards.forEach(card => {
        card.addEventListener("click", () => {
            const kana = card.querySelector("span").innerText;
            learned.has(kana) ? learned.delete(kana) : learned.add(kana);
            localStorage.setItem(storageKey, JSON.stringify([...learned]));
            updateProgress();
        });
        card.addEventListener("dblclick", () => {
            const romaji = card.querySelector("p").innerText;
            if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(romaji));
        });
    });

    search.addEventListener("input", () => {
        const query = search.value.toLowerCase().trim();
        cards.forEach(card => {
            const content = card.innerText.toLowerCase();
            card.style.display = content.includes(query) ? "block" : "none";
        });
    });
    document.getElementById("resetProgress").addEventListener("click", () => {
        learned.clear();
        localStorage.removeItem(storageKey);
        updateProgress();
    });
    updateProgress();
}

function loadQuestion() {
    const randomIndex = Math.floor(Math.random() * kanaList.length);
    currentQuestion = kanaList[randomIndex];
    
    document.getElementById("questionKana").innerText = currentQuestion.kana;
    
    const typeLabel = document.getElementById("kanaType");
    if(typeLabel) {
        typeLabel.innerText = currentQuestion.type;
        typeLabel.style.color = currentQuestion.type === "HIRAGANA" ? "#00f3ff" : "#ff00ea";
    }

    document.getElementById("answerInput").value = "";
    document.getElementById("feedback").innerText = "";
    document.getElementById("answerInput").focus();
}

function updateQuizStats() {
    document.getElementById("score").innerText = currentScore;
    document.getElementById("streak").innerText = currentStreak;
    document.getElementById("bestScore").innerText = bestScore;
}

// FUNGSI CHECK ANSWER DENGAN TRIGGER LEADERBOARD
function checkAnswer() {
    const userAnswer = document.getElementById("answerInput").value.toLowerCase().trim();
    const feedbackText = document.getElementById("feedback");

    if (userAnswer === currentQuestion.romaji) {
        currentScore += 10;
        currentStreak += 1;
        bestScore = Math.max(bestScore, currentScore);
        localStorage.setItem("nihongoBestScore", bestScore);
        updateQuizStats();
        
        // PENGIRIM SINYAL SKOR BARU
        window.dispatchEvent(new CustomEvent('updateLeaderboard', { detail: bestScore }));

        feedbackText.innerText = "ACCESS GRANTED. PERFECT! ⚡";
        feedbackText.style.color = "#00f3ff";
        feedbackText.style.textShadow = "0 0 10px #00f3ff";
        
        setTimeout(loadQuestion, 1000);
    } else {
        currentStreak = 0;
        updateQuizStats();
        feedbackText.innerText = `ERROR. JAWABAN: '${currentQuestion.romaji.toUpperCase()}'`;
        feedbackText.style.color = "#ff00ea";
        feedbackText.style.textShadow = "0 0 10px #ff00ea";
    }
}

window.onload = function() {
    setupInfoProfile();
    setupStudyPage();
    if(document.getElementById("questionKana")) {
        updateQuizStats();
        loadQuestion();
    }
};

document.getElementById("answerInput")?.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// ==========================================
// LOGIKA LOGIN GLOBAL DI HALAMAN INDEX 
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const globalLoginOverlay = document.getElementById("globalLoginOverlay");
    const guestPromptPopup = document.getElementById("guestPromptPopup");
    const topLoginToggle = document.getElementById("topLoginToggle");
    const topLoginText = document.getElementById("topLoginText");

    if (globalLoginOverlay && guestPromptPopup) {
        const mainLoginUser = document.getElementById("mainLoginUser");
        const mainLoginCode = document.getElementById("mainLoginCode");
        const mainLoginBtn = document.getElementById("mainLoginBtn");
        const mainLoginError = document.getElementById("mainLoginError");
        const closeLoginModal = document.getElementById("closeLoginModal");
        const btnPromptNanti = document.getElementById("btnPromptNanti");
        const btnPromptLogin = document.getElementById("btnPromptLogin");

        const accountCodes = {
            Umaedi: "UMAEDI2026",
            Iqbal: "IQBAL2026",
            Rifki: "RIFKI2026",
            Fasya: "FASYA2026"
        };

        const activeUser = localStorage.getItem("nihongoChatUser");
        const isGuestPromptDismissed = localStorage.getItem("guestPromptDismissed"); // Cek apakah tamu sudah klik Nanti
        
        if (activeUser) {
            // Jika sudah login, jangan tampilkan apa-apa
            globalLoginOverlay.style.display = "none";
            guestPromptPopup.style.display = "none";
            if(topLoginText) topLoginText.textContent = activeUser;
        } else if (isGuestPromptDismissed) {
            // Jika tamu sudah klik "Nanti", jangan diganggu lagi
            globalLoginOverlay.style.display = "none";
            guestPromptPopup.style.display = "none";
        } else {
            // Pengunjung baru pertama kali, munculkan pilihan
            globalLoginOverlay.style.display = "none";
            guestPromptPopup.style.display = "flex";
        }

        btnPromptNanti.addEventListener("click", () => {
            guestPromptPopup.style.display = "none";
            localStorage.setItem("guestPromptDismissed", "true"); // Simpan pilihan tamu permanen
        });

        btnPromptLogin.addEventListener("click", () => {
            guestPromptPopup.style.display = "none";
            globalLoginOverlay.style.display = "flex"; 
            localStorage.setItem("guestPromptDismissed", "true"); // Simpan agar tidak muncul lagi
        });

        if (topLoginToggle) {
            topLoginToggle.addEventListener("click", () => {
                const currentUser = localStorage.getItem("nihongoChatUser");
                if (currentUser) {
                    if (confirm(`Anda login sebagai ${currentUser}.\nIngin keluar dari akun ini?`)) {
                        localStorage.removeItem("nihongoChatUser"); 
                        window.location.reload();
                    }
                } else {
                    globalLoginOverlay.style.display = "flex";
                    guestPromptPopup.style.display = "none";
                }
            });
        }

        if (closeLoginModal) {
            closeLoginModal.addEventListener("click", () => {
                globalLoginOverlay.style.display = "none";
            });
        }

        function handleMainLogin() {
            const user = mainLoginUser.value;
            const code = mainLoginCode.value.trim().toUpperCase();
            
            if (!user) {
                mainLoginError.textContent = "Pilih akun terlebih dahulu.";
                return;
            }

            if (accountCodes[user] === code) {
                localStorage.setItem("nihongoChatUser", user);
                globalLoginOverlay.style.display = "none";
                if(topLoginText) topLoginText.textContent = user;
                mainLoginError.textContent = "";

                if (user === "Umaedi") {
                    const adminBtn = document.getElementById("adminToggleBtn");
                    if (adminBtn) adminBtn.style.display = "block";
                }
                
                const currentBest = Number(localStorage.getItem("nihongoBestScore") || 0);
                if (currentBest > 0) window.dispatchEvent(new CustomEvent('updateLeaderboard', { detail: currentBest }));
                
            } else {
                mainLoginError.textContent = "Akun atau kode rahasia salah.";
            }
        }

        mainLoginBtn.addEventListener("click", handleMainLogin);
        mainLoginCode.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleMainLogin();
        });
    }
});