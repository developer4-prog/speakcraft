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
