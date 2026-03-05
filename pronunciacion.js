let recognition;
let isListening = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  recognition = new (
    window.SpeechRecognition || window.webkitSpeechRecognition
  )();

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;
} else {
  alert("Speech Recognition is not supported in this browser.");
}

/* ================================
   CLEAN TEXT
================================ */
function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?:"’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ================================
   GET DIALOGUE FROM BUBBLES
================================ */
function getDialogueText() {
  const container = document.getElementById("practiceDialogue");
  if (!container) return "";

  const bubbles = container.querySelectorAll(".bubble");

  let fullText = "";

  bubbles.forEach((bubble) => {
    let text = bubble.innerText;

    // remove A: or B:
    text = text.replace(/^A:\s*/i, "");
    text = text.replace(/^B:\s*/i, "");

    fullText += text + " ";
  });

  return cleanText(fullText);
}

/* ================================
   GET REFERENCE TEXT (AUTO MODE)
================================ */
function getReferenceText() {
  // Case 1: fixed dialogue exists
  const practice = document.getElementById("practiceDialogue");
  if (practice) {
    return getDialogueText();
  }

  // Case 2: student textarea exists
  const textarea = document.getElementById("dialogueText");
  if (textarea) {
    return cleanText(textarea.value);
  }

  return "";
}

/* ================================
   TOGGLE BUTTON
================================ */
function togglePronunciation() {
  const button = document.getElementById("gradeBtn");
  const result = document.getElementById("scoreResult");

  const referenceText = getReferenceText();

  if (!referenceText) {
    alert("No reference text found.");
    return;
  }

  if (!isListening) {
    recognition.start();
    isListening = true;

    button.textContent = "⏹ Stop pronunciation check";
    button.style.backgroundColor = "#c0392b";
    result.textContent = "🎤 Listening... Speak now";
  } else {
    recognition.stop();
    isListening = false;

    button.textContent = "⭐ Start pronunciation check";
    button.style.backgroundColor = "";
  }
}

/* ================================
   RESULT
================================ */
recognition.onresult = function (event) {
  const spokenRaw = event.results[event.results.length - 1][0].transcript;

  const spokenText = cleanText(spokenRaw);
  const referenceText = getReferenceText();

  if (!spokenText) {
    document.getElementById("scoreResult").textContent =
      "❌ No speech detected.";
    return;
  }

  const spokenWords = spokenText.split(" ");
  const referenceWords = referenceText.split(" ");

  let matches = 0;

  referenceWords.forEach((word) => {
    if (spokenWords.includes(word)) {
      matches++;
    }
  });

  const score = Math.round((matches / referenceWords.length) * 100);

  document.getElementById("scoreResult").textContent =
    "⭐ Pronunciation Score: " + score + "%";
};

/* ================================
   ERROR
================================ */
recognition.onerror = function () {
  document.getElementById("scoreResult").textContent = "❌ No speech detected.";
};

recognition.onend = function () {
  isListening = false;
  const button = document.getElementById("gradeBtn");
  if (button) {
    button.textContent = "⭐ Start pronunciation check";
    button.style.backgroundColor = "";
  }
};
