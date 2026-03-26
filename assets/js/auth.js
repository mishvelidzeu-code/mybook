(function () {
  function showMessage(element, message, type = "success") {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message show ${type}`;
  }

  function setPendingState(form, isPending) {
    const submitButton = form?.querySelector('button[type="submit"]');
    if (!submitButton) return null;
    submitButton.disabled = isPending;
    return submitButton;
  }

  function readValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("loginMessage");
      setPendingState(loginForm, true);

      try {
        const payload = {
          email: readValue("loginEmail"),
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
        setPendingState(loginForm, false);
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("registerMessage");
      const password = document.getElementById("registerPassword").value;
      const passwordConfirm = document.getElementById("registerPasswordConfirm").value;

      if (password !== passwordConfirm) {
        showMessage(messageBox, "პაროლები ერთმანეთს არ ემთხვევა", "error");
        return;
      }

      setPendingState(registerForm, true);

      try {
        const payload = {
          name: readValue("registerName"),
          email: readValue("registerEmail"),
          password,
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
        setPendingState(registerForm, false);
      }
    });
  }

  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("forgotPasswordMessage");
      setPendingState(forgotPasswordForm, true);

      try {
        const result = await Api.requestPasswordReset({
          email: readValue("forgotPasswordEmail")
        });

        showMessage(
          messageBox,
          result.message || "თუ ეს ელფოსტა არსებობს, პაროლის აღდგენის ბმული გამოგზავნილია.",
          "success"
        );
        forgotPasswordForm.reset();
      } catch (error) {
        showMessage(messageBox, error.message || "აღდგენის წერილი ვერ გაიგზავნა", "error");
      } finally {
        setPendingState(forgotPasswordForm, false);
      }
    });
  }

  const resetPasswordForm = document.getElementById("resetPasswordForm");
  if (resetPasswordForm) {
    const messageBox = document.getElementById("resetPasswordMessage");
    const locationState = `${window.location.search || ""}${window.location.hash || ""}`;
    const looksLikeRecoveryFlow = /type=recovery|access_token=|refresh_token=|token_hash=|code=/.test(locationState);

    if (!looksLikeRecoveryFlow) {
      showMessage(
        messageBox,
        "თუ პაროლი დაგავიწყდა, ჯერ ელფოსტაზე გამოითხოვე აღდგენის ბმული და მერე ამ გვერდზე დაბრუნდი.",
        "info"
      );
    }

    resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nextPassword = document.getElementById("resetPassword").value;
      const nextPasswordConfirm = document.getElementById("resetPasswordConfirm").value;

      if (nextPassword !== nextPasswordConfirm) {
        showMessage(messageBox, "პაროლები ერთმანეთს არ ემთხვევა", "error");
        return;
      }

      setPendingState(resetPasswordForm, true);

      try {
        const result = await Api.updatePassword({
          password: nextPassword
        });

        showMessage(messageBox, result.message || "პაროლი წარმატებით განახლდა", "success");
        resetPasswordForm.reset();

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } catch (error) {
        showMessage(messageBox, error.message || "პაროლის განახლება ვერ შესრულდა", "error");
      } finally {
        setPendingState(resetPasswordForm, false);
      }
    });
  }
})();
