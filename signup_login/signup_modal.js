(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  var signupBtn = qs("signupBtn");
  var modal = qs("signupModal");
  var closeBtn = qs("signupClose");
  var form = qs("signupForm");
  var errorBox = qs("signupError");

  if (!signupBtn || !modal || !closeBtn || !form || !errorBox) {
    return;
  }

  function openModal() {
    modal.classList.add("open");
    errorBox.classList.remove("visible");
  }

  function closeModal() {
    modal.classList.remove("open");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("visible");
  }

  signupBtn.addEventListener("click", function (event) {
    event.preventDefault();
    openModal();
  });

  closeBtn.addEventListener("click", function () {
    closeModal();
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = qs("signupEmail").value.trim();
    var password = qs("signupPassword").value;
    var confirmPassword = qs("signupConfirmPassword").value;

    if (!email || !password || !confirmPassword) {
      showError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    showError("Signup submitted (demo only).");
  });
})();
