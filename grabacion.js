<<<<<<< HEAD
// ================================
// VARIABLE GLOBAL (solo grabación)
// ================================
let isRecording = false;

document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const audioPlayback = document.getElementById("audioPlayback");
  const downloadBtn = document.getElementById("downloadBtn");

  // =========================
  // INICIAR GRABACIÓN
  // =========================
  startBtn.addEventListener("click", async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      isRecording = true;
      audioChunks = [];

      startBtn.disabled = true;
      stopBtn.disabled = false;
      startBtn.textContent = "🔴 Recording...";

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Mostrar reproductor
        audioPlayback.src = audioUrl;

        // Mostrar botón descarga
        downloadBtn.style.display = "inline-block";

        downloadBtn.onclick = function () {
          const a = document.createElement("a");
          a.href = audioUrl;
          a.download = "conversation_recording.webm";
          a.click();
        };
      });
    } catch (error) {
      alert("Microphone access denied or not supported.");
    }
  });

  // =========================
  // DETENER GRABACIÓN
  // =========================
  stopBtn.addEventListener("click", () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    mediaRecorder.stop();
    isRecording = false;

    startBtn.disabled = false;
    stopBtn.disabled = true;
    startBtn.textContent = "🎤 Record";
  });
});
=======
(() => {
  // ================================
  // VARIABLES INTERNAS (solo grabación)
  // ================================
  let isAudioRecording = false;
  let mediaRecorder;
  let audioChunks = [];
  let currentStream = null;

  document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const audioPlayback = document.getElementById("audioPlayback");
    const downloadBtn = document.getElementById("downloadBtn");

    if (!startBtn || !stopBtn || !audioPlayback || !downloadBtn) return;

    // =========================
    // INICIAR GRABACIÓN
    // =========================
    startBtn.addEventListener("click", async () => {
      if (isAudioRecording) return;

      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        mediaRecorder = new MediaRecorder(currentStream);
        mediaRecorder.start();

        isAudioRecording = true;
        audioChunks = [];

        startBtn.disabled = true;
        stopBtn.disabled = false;
        startBtn.textContent = "🔴 Recording...";

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(audioBlob);

          audioPlayback.src = audioUrl;
          downloadBtn.style.display = "inline-block";

          downloadBtn.onclick = function () {
            const a = document.createElement("a");
            a.href = audioUrl;
            a.download = "conversation_recording.webm";
            a.click();
          };

          if (currentStream) {
            currentStream.getTracks().forEach((track) => track.stop());
            currentStream = null;
          }
        };
      } catch (error) {
        alert("Microphone access denied or not supported.");
      }
    });

    // =========================
    // DETENER GRABACIÓN
    // =========================
    stopBtn.addEventListener("click", () => {
      if (!mediaRecorder || mediaRecorder.state === "inactive") return;

      mediaRecorder.stop();
      isAudioRecording = false;

      startBtn.disabled = false;
      stopBtn.disabled = true;
      startBtn.textContent = "🎤 Record";
    });
  });
})();
>>>>>>> 6f13644 (Primer commit SpeakCraft tesis)
