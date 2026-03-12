/**
 * Lógica de reproducción de Audios por Rol
 */
function playRole(role) {
  const audioPlayer = document.getElementById("globalAudio");
  const statusText = document.querySelector(".player-header span");

  if (!audioPlayer) return;

  audioPlayer.pause();
  audioPlayer.currentTime = 0;

  switch (role) {
    case "A":
      audioPlayer.src = "audio/unit1_person_A.mp3";
      statusText.innerHTML =
        "✨ <strong>Practice:</strong> You are Person B (Listen to A)";
      statusText.style.color = "#2563eb";
      break;

    case "B":
      audioPlayer.src = "audio/unit1_person_B.mp3";
      statusText.innerHTML =
        "✨ <strong>Practice:</strong> You are Person A (Listen to B)";
      statusText.style.color = "#059669";
      break;

    case "FULL":
      audioPlayer.src = "audio/full_conversation.mp3";
      statusText.innerHTML = "Listen to the full conversation";
      statusText.style.color = "white";
      break;
  }

  audioPlayer.play().catch((error) => {
    console.log("Interacción requerida para reproducir audio.");
  });
}
