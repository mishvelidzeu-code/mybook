(function () {
  function showMessage(element, message, type = "success") {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message show ${type}`;
  }

  function clearMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.className = "form-message";
  }

  function readValue(id) {
    const element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
  }

  function setPendingState(form, isPending) {
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    if (!submitButton.dataset.defaultLabel) {
      submitButton.dataset.defaultLabel = submitButton.textContent || "";
    }

    submitButton.disabled = isPending;
    submitButton.textContent = isPending
      ? "მიმდინარეობს..."
      : submitButton.dataset.defaultLabel;
  }

  function cacheAuthResult(result) {
    if (!result || typeof result !== "object") {
      return;
    }

    if (result.token) {
      localStorage.setItem("token", result.token);
    }

    if (result.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
    }
  }

  function syncSupabaseUser() {
    if (!window.SupabaseService?.isEnabled?.() || typeof window.SupabaseService.syncSessionUser !== "function") {
      return Promise.resolve(null);
    }

    const timeout = new Promise((resolve) => {
      window.setTimeout(() => resolve(null), 1200);
    });

    return Promise.race([
      window.SupabaseService.syncSessionUser().catch(() => null),
      timeout
    ]);
  }

  function redirectSoon(url, delay = 350) {
    window.setTimeout(() => {
      window.location.href = url;
    }, delay);
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("loginMessage");
      clearMessage(messageBox);
      setPendingState(loginForm, true);

      try {
        const payload = {
          email: readValue("loginEmail"),
          password: readValue("loginPassword")
        };

        const result = await Api.login(payload);
        cacheAuthResult(result);
        syncSupabaseUser();

        showMessage(messageBox, "წარმატებით შეხვედი ავტორის პანელში", "success");
        redirectSoon("admin.html");
      } catch (error) {
        showMessage(messageBox, error?.message || "შესვლა ვერ შესრულდა", "error");
        setPendingState(loginForm, false);
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("registerMessage");
      clearMessage(messageBox);

      const password = readValue("registerPassword");
      const passwordConfirm = readValue("registerPasswordConfirm");

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
          role: readValue("registerRole") || "author"
        };

        const result = await Api.register(payload);
        cacheAuthResult(result);

        if (result?.requiresEmailConfirmation && !result?.token) {
          showMessage(
            messageBox,
            result.message || "რეგისტრაცია დასრულდა. გააქტიურების ბმული ელფოსტაზე მოგივა.",
            "success"
          );
          setPendingState(registerForm, false);
          return;
        }

        syncSupabaseUser();

        showMessage(
          messageBox,
          result?.message || "რეგისტრაცია დასრულდა და შეგიძლია პანელში გააგრძელო",
          "success"
        );
        redirectSoon("admin.html");
      } catch (error) {
        showMessage(messageBox, error?.message || "რეგისტრაცია ვერ შესრულდა", "error");
        setPendingState(registerForm, false);
      }
    });
  }

  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("forgotPasswordMessage");
      clearMessage(messageBox);
      setPendingState(forgotPasswordForm, true);

      try {
        const result = await Api.requestPasswordReset({
          email: readValue("forgotPasswordEmail")
        });

        showMessage(
          messageBox,
          result?.message || "თუ ეს ელფოსტა არსებობს, აღდგენის ბმული გამოგზავნილია.",
          "success"
        );
      } catch (error) {
        showMessage(messageBox, error?.message || "აღდგენის წერილის გაგზავნა ვერ შესრულდა", "error");
      } finally {
        setPendingState(forgotPasswordForm, false);
      }
    });
  }

  const resetPasswordForm = document.getElementById("resetPasswordForm");
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const messageBox = document.getElementById("resetPasswordMessage");
      clearMessage(messageBox);

      const password = readValue("resetPassword");
      const passwordConfirm = readValue("resetPasswordConfirm");

      if (password !== passwordConfirm) {
        showMessage(messageBox, "ახალი პაროლები ერთმანეთს არ ემთხვევა", "error");
        return;
      }

      setPendingState(resetPasswordForm, true);

      try {
        const result = await Api.updatePassword({ password });
        showMessage(messageBox, result?.message || "პაროლი წარმატებით განახლდა", "success");
        redirectSoon("login.html", 700);
      } catch (error) {
        showMessage(messageBox, error?.message || "პაროლის განახლება ვერ შესრულდა", "error");
        setPendingState(resetPasswordForm, false);
      }
    });
  }
})();
