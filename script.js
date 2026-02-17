let timeout;

function showTranslation(element) {
  clearTimeout(timeout);
  element.classList.add("show");

  timeout = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}
