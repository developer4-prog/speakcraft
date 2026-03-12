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
   EDIT DISTANCE + SIMILARITY
================================ */
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;

    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];

        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }

        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }

    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;

  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }

  const longerLength = longer.length;

  if (longerLength === 0) return 1;

  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

/* ================================
   TOKENIZE
================================ */
function tokenize(text) {
  return cleanText(text).split(" ").filter(Boolean);
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
   FIND SPOKEN SEGMENT IN ORDER
   Detects how far into the dialogue the user managed to speak
================================ */
function findSpokenSegment(referenceWords, spokenWords) {
  let matchedPairs = [];
  let refIndex = 0;
  let spokenIndex = 0;

  while (refIndex < referenceWords.length && spokenIndex < spokenWords.length) {
    let bestRefIndex = -1;
    let bestScore = 0;

    for (
      let j = refIndex;
      j < Math.min(refIndex + 6, referenceWords.length);
      j++
    ) {
      const score = similarity(referenceWords[j], spokenWords[spokenIndex]);

      if (score > bestScore) {
        bestScore = score;
        bestRefIndex = j;
      }
    }

    if (bestRefIndex !== -1 && bestScore >= 0.6) {
      matchedPairs.push({
        refWord: referenceWords[bestRefIndex],
        spokenWord: spokenWords[spokenIndex],
        score: bestScore,
        refIndex: bestRefIndex,
        spokenIndex: spokenIndex,
      });

      refIndex = bestRefIndex + 1;
    }

    spokenIndex++;
  }

  if (matchedPairs.length === 0) {
    return {
      matchedPairs: [],
      completionScore: 0,
      evaluatedReferenceText: "",
      evaluatedSpokenText: "",
    };
  }

  const lastMatchedRefIndex = matchedPairs[matchedPairs.length - 1].refIndex;
  const evaluatedReferenceWords = referenceWords.slice(
    0,
    lastMatchedRefIndex + 1,
  );

  return {
    matchedPairs,
    completionScore: Math.round(
      ((lastMatchedRefIndex + 1) / referenceWords.length) * 100,
    ),
    evaluatedReferenceText: evaluatedReferenceWords.join(" "),
    evaluatedSpokenText: spokenWords.join(" "),
  };
}

/* ================================
   ACCURACY OF THE SPOKEN PART
================================ */
function calculateSpokenPartAccuracy(evaluatedReferenceWords, spokenWords) {
  if (!evaluatedReferenceWords.length || !spokenWords.length) return 0;

  let matchedScoreSum = 0;
  let matchedCount = 0;
  let spokenPointer = 0;

  for (let i = 0; i < evaluatedReferenceWords.length; i++) {
    for (let j = spokenPointer; j < spokenWords.length; j++) {
      const score = similarity(evaluatedReferenceWords[i], spokenWords[j]);

      if (score >= 0.6) {
        matchedScoreSum += score;
        matchedCount++;
        spokenPointer = j + 1;
        break;
      }
    }
  }

  const coverage = matchedCount / evaluatedReferenceWords.length;
  const averageQuality = matchedCount > 0 ? matchedScoreSum / matchedCount : 0;

  return Math.round((coverage * 0.7 + averageQuality * 0.3) * 100);
}

/* ================================
   FINAL SCORE LOGIC
================================ */
function calculateDetailedScore(referenceText, spokenText) {
  const referenceWords = tokenize(referenceText);
  const spokenWords = tokenize(spokenText);

  if (!referenceWords.length || !spokenWords.length) {
    return {
      finalScore: 0,
      completionScore: 0,
      spokenAccuracy: 0,
    };
  }

  const segmentData = findSpokenSegment(referenceWords, spokenWords);
  const evaluatedReferenceWords = tokenize(segmentData.evaluatedReferenceText);
  const completionScore = segmentData.completionScore;
  const spokenAccuracy = calculateSpokenPartAccuracy(
    evaluatedReferenceWords,
    spokenWords,
  );

  let finalScore = Math.round(spokenAccuracy * 0.8 + completionScore * 0.2);

  if (spokenAccuracy >= 75 && completionScore >= 50) finalScore += 5;
  if (spokenAccuracy >= 85 && completionScore >= 70) finalScore += 5;

  if (finalScore > 100) finalScore = 100;

  if (completionScore < 40 && finalScore > 80) finalScore = 80;
  if (completionScore < 25 && finalScore > 65) finalScore = 65;
  if (completionScore < 15 && finalScore > 50) finalScore = 50;

  return {
    finalScore,
    completionScore,
    spokenAccuracy,
  };
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

    result.classList.remove("score-good", "score-medium", "score-bad");
    result.classList.add("show");
    result.textContent = "🎤 Listening... Speak now";
  } else {
    recognition.stop();
    isListening = false;

    button.textContent = "⭐ Start pronunciation check";
    button.style.backgroundColor = "";

    setTimeout(() => {
      calculatePronunciationScore();
    }, 400);
  }
}

/* ================================
   CAPTURE SPEECH
================================ */
recognition.onresult = function (event) {
  finalTranscript = "";

  for (let i = 0; i < event.results.length; i++) {
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
    scoreBox.classList.remove("score-good", "score-medium", "score-bad");
    scoreBox.innerHTML = "❌ No speech detected.";
    scoreBox.classList.add("show");

    setTimeout(() => {
      scoreBox.classList.remove("show");
      scoreBox.textContent = "";
    }, 6000);

    return;
  }

  const result = calculateDetailedScore(referenceText, spokenText);
  const finalScore = result.finalScore;
  const completionScore = result.completionScore;
  const spokenAccuracy = result.spokenAccuracy;

  let feedback = "";

  scoreBox.classList.remove("score-good", "score-medium", "score-bad");

  if (spokenAccuracy >= 85) {
    feedback = "🟢 Excellent spoken accuracy";
    scoreBox.classList.add("score-good");
  } else if (spokenAccuracy >= 65) {
    feedback = "🟡 Good spoken accuracy";
    scoreBox.classList.add("score-medium");
  } else if (spokenAccuracy >= 40) {
    feedback = "🟠 Fair spoken accuracy";
    scoreBox.classList.add("score-medium");
  } else {
    feedback = "🔴 Low spoken accuracy";
    scoreBox.classList.add("score-bad");
  }

  scoreBox.innerHTML = `
    <strong>${feedback}</strong><br>
    Final score: ${finalScore}%<br>
    Spoken part accuracy: ${spokenAccuracy}%<br>
    Dialogue completion: ${completionScore}%
  `;

  scoreBox.classList.add("show");

  console.log("Reference:", referenceText);
  console.log("Spoken:", spokenText);
  console.log("Result:", result);

  setTimeout(() => {
    scoreBox.classList.remove("show");
    scoreBox.textContent = "";
    scoreBox.classList.remove("score-good", "score-medium", "score-bad");
  }, 7000);

  finalTranscript = "";
}

/* ================================
   ERROR
================================ */
recognition.onerror = function () {
  const scoreBox = document.getElementById("scoreResult");

  scoreBox.classList.remove("score-good", "score-medium", "score-bad");
  scoreBox.textContent = "❌ No speech detected.";
  scoreBox.classList.add("show");

  setTimeout(() => {
    scoreBox.classList.remove("show");
    scoreBox.textContent = "";
  }, 5000);
};
