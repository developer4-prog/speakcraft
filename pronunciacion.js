let finalTranscript = "";
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
   TEXT SIMILARITY
================================ */
function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;

  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }

  const longerLength = longer.length;

  if (longerLength === 0) {
    return 1.0;
  }

  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function wordScore(referenceText, spokenText) {
  const refWords = referenceText.split(" ");
  const spokenWords = spokenText.split(" ");

  let totalScore = 0;

  refWords.forEach((refWord) => {
    let bestMatch = 0;

    spokenWords.forEach((spokenWord) => {
      const score = similarity(refWord, spokenWord);

      if (score > bestMatch) {
        bestMatch = score;
      }
    });

    totalScore += bestMatch;
  });

  return Math.round((totalScore / refWords.length) * 100);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;

    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];

          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;

          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }

    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
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

    text = text.replace(/^A:\s*/i, "");
    text = text.replace(/^B:\s*/i, "");

    fullText += text + " ";
  });

  return cleanText(fullText);
}

/* ================================
   GET REFERENCE TEXT
================================ */
function getReferenceText() {
  const practice = document.getElementById("practiceDialogue");

  if (practice) {
    return getDialogueText();
  }

  const textarea = document.getElementById("dialogueText");

  if (textarea) {
    return cleanText(textarea.value);
  }

  return "";
}

/* ================================
   START / STOP BUTTON
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
    finalTranscript = "";

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

    setTimeout(() => {
      calculatePronunciationScore();
    }, 300);
  }
}

/* ================================
   CAPTURE SPEECH
================================ */
recognition.onresult = function (event) {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    finalTranscript += event.results[i][0].transcript + " ";
  }
};

/* ================================
   CALCULATE SCORE
================================ */
function calculatePronunciationScore() {
  const spokenText = cleanText(finalTranscript);
  const referenceText = getReferenceText();
  const scoreBox = document.getElementById("scoreResult");

  if (!spokenText) {
    scoreBox.textContent = "❌ No speech detected.";
    scoreBox.classList.add("show");

    setTimeout(() => {
      scoreBox.classList.remove("show");
      scoreBox.textContent = "";
    }, 3000);

    return;
  }

  const score = wordScore(referenceText, spokenText);

  let feedback = "";

  if (score >= 90) {
    feedback = "🟢 Excellent pronunciation!";
  } else if (score >= 75) {
    feedback = "🟡 Good pronunciation!";
  } else if (score >= 50) {
    feedback = "🟠 Understandable but needs practice.";
  } else {
    feedback = "🔴 Try again.";
  }

  scoreBox.textContent = feedback + " (" + score + "%)";
  scoreBox.classList.add("show");

  setTimeout(() => {
    scoreBox.classList.remove("show");
    scoreBox.textContent = "";
  }, 3000);

  finalTranscript = "";
}

/* ================================
   ERROR
================================ */
recognition.onerror = function () {
  document.getElementById("scoreResult").textContent = "❌ No speech detected.";
};
