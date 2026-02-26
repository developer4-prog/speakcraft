/* ================================
   MOSTRAR TRADUCCIÓN (SOLO CLICK)
================================ */
function showTranslation(vocabItem) {
  // Quita la traducción de otros items abiertos
  document.querySelectorAll(".vocab-item.show").forEach((item) => {
    if (item !== vocabItem) {
      item.classList.remove("show");
    }
  });

  // Muestra la traducción del item clickeado
  vocabItem.classList.add("show");

  // Oculta después de 2 segundos
  setTimeout(() => {
    vocabItem.classList.remove("show");
  }, 2000);
}

/* ================================
   REPRODUCIR AUDIO DE PRONUNCIACIÓN
================================ */
function playAudio(event, audioSrc) {
  event.stopPropagation(); // evita activar traducción

  const audio = new Audio(audioSrc);
  audio.volume = 1.0; // 🔊 volumen máximo permitido
  audio.play();
}

/* ================================
   GRABACIÓN DE AUDIO
================================ */
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let recordedBlob = null;

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioURL = URL.createObjectURL(recordedBlob);
      document.getElementById("audioPlayback").src = audioURL;
    };

    mediaRecorder.start();
  });
}

function stopRecording() {
  if (mediaRecorder) mediaRecorder.stop();
}

/* ================================
   DESCARGAR TEXTO
================================ */
function downloadText() {
  const text = document.getElementById("dialogueText").value;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "dialogue.txt";
  link.click();
}

/* ================================
   DESCARGAR AUDIO
================================ */
function downloadAudio() {
  if (!recordedBlob) {
    alert("No audio recorded yet");
    return;
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(recordedBlob);
  link.download = "dialogue_audio.webm";
  link.click();
}

/* ================================
   CALIFICAR PRONUNCIACIÓN
   (Speech Recognition)
================================ */
function gradePronunciation() {
  const text = document.getElementById("dialogueText").value.toLowerCase();
  const scoreResult = document.getElementById("scoreResult");

  if (!text.trim()) {
    scoreResult.textContent = "Write your dialogue first.";
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    scoreResult.textContent = "Speech recognition not supported.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  scoreResult.textContent = "🎧 Listening... speak now";

  recognition.start();

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.toLowerCase();

    function normalize(text) {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(" ")
        .filter((w) => w.length > 2);
    }

    const writtenWords = [...new Set(normalize(text))];
    const spokenWords = normalize(spokenText);

    let matches = 0;
    writtenWords.forEach((word) => {
      if (spokenWords.includes(word)) matches++;
    });

    const score = Math.round((matches / writtenWords.length) * 100);

    let level = "";
    let emoji = "";

    let missedWords = [];

    writtenWords.forEach((word) => {
      if (!spokenWords.includes(word)) {
        missedWords.push(word);
      }
    });

    if (score >= 85) {
      level = "Excellent";
      emoji = "🟢";
    } else if (score >= 60) {
      level = "Good";
      emoji = "🟡";
    } else {
      level = "Needs Practice";
      emoji = "🔴";
    }

    scoreResult.innerHTML = `
${emoji} Pronunciation score: ${score}% — ${level}
<br>❌ Missing words: ${missedWords.length ? missedWords.join(", ") : "None 🎉"}
`;
  };

  recognition.onerror = (event) => {
    scoreResult.textContent =
      "❌ Microphone error. Use HTTPS or allow microphone access.";
  };
}

let recognition;
let isListening = false;

function togglePronunciation() {
  const scoreResult = document.getElementById("scoreResult");
  const button = document.getElementById("gradeBtn");

  if (isRecording) {
    scoreResult.textContent =
      "⛔ Stop recording before checking pronunciation.";
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    scoreResult.textContent = "Speech recognition not supported.";
    return;
  }

  if (!isListening) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    scoreResult.textContent = "🎧 Listening... click again to finish";
    button.textContent = "⏹ Stop & grade";
    isListening = true;

    recognition.start();

    recognition.onresult = (event) => {
      window._spokenText = "";
      for (let i = 0; i < event.results.length; i++) {
        window._spokenText += event.results[i][0].transcript + " ";
      }
    };

    recognition.onerror = () => {
      scoreResult.textContent = "❌ Listening error.";
    };
  } else {
    recognition.stop();
    isListening = false;
    button.textContent = "⭐ Start pronunciation check";

    evaluatePronunciation();
  }
}

function evaluatePronunciation() {
  const text = document.getElementById("dialogueText").value.toLowerCase();
  const spokenText = (window._spokenText || "").toLowerCase();
  const scoreResult = document.getElementById("scoreResult");

  if (!spokenText.trim()) {
    scoreResult.textContent = "❌ No speech detected.";
    return;
  }

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  const writtenWords = normalize(text);
  const spokenWords = normalize(spokenText);

  let matches = 0;
  writtenWords.forEach((word) => {
    if (spokenWords.includes(word)) matches++;
  });

  const score = Math.round((matches / writtenWords.length) * 100);

  let level = "";
  let emoji = "";

  if (score >= 85) {
    level = "Excellent";
    emoji = "🟢";
  } else if (score >= 60) {
    level = "Good";
    emoji = "🟡";
  } else {
    level = "Needs Practice";
    emoji = "🔴";
  }

  scoreResult.textContent = `${emoji} Pronunciation score: ${score}% — ${level}`;
}
