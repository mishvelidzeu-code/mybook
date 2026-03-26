(function () {
  function showMessage(element, message, type = "success") {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message show ${type}`;
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("loginMessage");
      const submitButton = loginForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      try {
        const payload = {
          email: document.getElementById("loginEmail").value.trim(),
          password: document.getElementById("loginPassword").value
        };

        const result = await Api.login(payload);
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        showMessage(messageBox, "შესვლა წარმატებულია, გადადიხარ პანელში", "success");

        setTimeout(() => {
          window.location.href = "admin.html";
        }, 700);
      } catch (error) {
        showMessage(messageBox, error.message || "შესვლა ვერ შესრულდა", "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("registerMessage");
      const submitButton = registerForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      try {
        const payload = {
          name: document.getElementById("registerName").value.trim(),
          email: document.getElementById("registerEmail").value.trim(),
          password: document.getElementById("registerPassword").value,
          role: document.getElementById("registerRole").value
        };

        const result = await Api.register(payload);
        showMessage(messageBox, result.message || "რეგისტრაცია დასრულდა", "success");

        if (result.requiresEmailConfirmation) {
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1200);
          return;
        }

        if (result.token) {
          localStorage.setItem("token", result.token);
        }

        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        setTimeout(() => {
          window.location.href = result.user ? "upload.html" : "login.html";
        }, 800);
      } catch (error) {
        showMessage(messageBox, error.message || "რეგისტრაცია ვერ შესრულდა", "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
