// Settings Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Change Email Modal
  const changeEmailBtn = document.getElementById("changeEmailBtn");
  const changeEmailModal = document.getElementById("changeEmailModal");
  const cancelChangeEmail = document.getElementById("cancelChangeEmail");
  const changeEmailForm = document.getElementById("changeEmailForm");

  if (changeEmailBtn && changeEmailModal) {
    changeEmailBtn.addEventListener("click", () => {
      changeEmailModal.classList.add("active");
      document.getElementById("newEmail").focus();
    });

    cancelChangeEmail.addEventListener("click", () => {
      changeEmailModal.classList.remove("active");
      changeEmailForm.reset();
    });

    // Change Email Form Submission
    changeEmailForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newEmail = document.getElementById("newEmail").value;
      const currentPassword = document.getElementById(
        "currentPasswordEmail"
      ).value;
      const submitBtn = document.getElementById("confirmChangeEmailBtn");

      if (!newEmail || !currentPassword) {
        alert("Please fill in all fields");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        alert("Please enter a valid email address");
        return;
      }

      const currentEmail = document.querySelector(
        ".setting-description strong"
      ).textContent;
      if (newEmail === currentEmail) {
        alert("New email cannot be same as current email");
        return;
      }

      submitBtn.textContent = "Sending verification...";
      submitBtn.disabled = true;

      try {
        const response = await fetch("/settings/change-email/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            new_email: newEmail,
            current_password: currentPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert(
            "✅ " +
              data.message +
              "\n\nPlease check your email inbox and click the verification link to complete the email change."
          );
          showPendingEmailChangeStatus(newEmail);
          changeEmailModal.classList.remove("active");
          changeEmailForm.reset();
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (error) {
        alert("❌ Error sending verification email. Please try again.");
      } finally {
        submitBtn.textContent = "Change Email";
        submitBtn.disabled = false;
      }
    });
  }

  // Change Password Modal
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const changePasswordModal = document.getElementById("changePasswordModal");
  const cancelChangePassword = document.getElementById("cancelChangePassword");
  const changePasswordForm = document.getElementById("changePasswordForm");

  if (changePasswordBtn && changePasswordModal) {
    changePasswordBtn.addEventListener("click", () => {
      changePasswordModal.classList.add("active");
      document.getElementById("currentPassword").focus();
    });

    cancelChangePassword.addEventListener("click", () => {
      changePasswordModal.classList.remove("active");
      changePasswordForm.reset();
    });

    // Change Password Form Submission
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmNewPassword =
        document.getElementById("confirmNewPassword").value;
      const submitBtn = document.getElementById("confirmChangePasswordBtn");

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert("Please fill in all fields");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        alert("New passwords do not match");
        return;
      }

      if (newPassword.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
      }

      // Show loading state
      submitBtn.textContent = "Changing...";
      submitBtn.disabled = true;

      try {
        const response = await fetch("/settings/change-password/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("Password changed successfully!");
          changePasswordModal.classList.remove("active");
          changePasswordForm.reset();
        } else {
          alert("Error: " + data.message);
        }
      } catch (error) {
        alert("Error changing password. Please try again.");
      } finally {
        submitBtn.textContent = "Change Password";
        submitBtn.disabled = false;
      }
    });
  }

  // Export Data Modal
  const exportDataBtn = document.getElementById("exportDataBtn");
  const exportDataModal = document.getElementById("exportDataModal");
  const cancelExportData = document.getElementById("cancelExportData");
  const confirmExportDataBtn = document.getElementById("confirmExportDataBtn");

  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", () => {
      exportDataModal.classList.add("active");
    });

    cancelExportData.addEventListener("click", () => {
      exportDataModal.classList.remove("active");
    });

    confirmExportDataBtn.addEventListener("click", async () => {
      confirmExportDataBtn.textContent = "Preparing Export...";
      confirmExportDataBtn.disabled = true;

      try {
        const response = await fetch("/settings/export-data/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            personal_info: true,
            health_profile: true,
            chat_history: true,
            account_settings: true,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("✅ " + data.message);
          exportDataModal.classList.remove("active");
          showPendingExportStatus();
        } else {
          alert("❌ Error: " + data.message);
          confirmExportDataBtn.textContent = "Request Data Export";
          confirmExportDataBtn.disabled = false;
        }
      } catch (error) {
        alert("❌ Error requesting data export. Please try again.");
        confirmExportDataBtn.textContent = "Request Data Export";
        confirmExportDataBtn.disabled = false;
      }
    });
  }

  // Function to show pending email change status
  function showPendingEmailChangeStatus(newEmail) {
    const emailSettingItem = document.querySelector(
      '.setting-item:has(.setting-title:contains("Email Address"))'
    );
    if (emailSettingItem) {
      const description = emailSettingItem.querySelector(
        ".setting-description"
      );
      description.innerHTML = `
        <div style="margin-bottom: 10px;">
          Your current email address: <strong>${
            document.querySelector(".setting-description strong").textContent
          }</strong>
        </div>
        <div style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Pending Email Change:</strong>
          <div style="margin-top: 5px;">
            New email: <strong>${newEmail}</strong>
            <br>
            <small>Check your current email for verification link (expires in 24 hours)</small>
            <br>
            <button class="btn btn-secondary" id="cancelPendingEmail" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;">
              Cancel Request
            </button>
          </div>
        </div>
      `;

      // Add cancel button functionality
      document
        .getElementById("cancelPendingEmail")
        ?.addEventListener("click", async function () {
          if (
            confirm("Are you sure you want to cancel the pending email change?")
          ) {
            try {
              const response = await fetch("/settings/cancel-email-change/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": getCSRFToken(),
                },
              });

              const data = await response.json();

              if (data.success) {
                alert("✅ Email change request cancelled.");
                location.reload();
              } else {
                alert("❌ Error: " + data.message);
              }
            } catch (error) {
              alert("❌ Error cancelling request. Please try again.");
            }
          }
        });
    }
  }

  // Check for pending email changes on page load
  async function checkPendingEmailChanges() {
    try {
      const response = await fetch("/settings/check-pending-email/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
      });

      const data = await response.json();

      if (data.success && data.pending_change) {
        showPendingEmailChangeStatus(data.pending_change.new_email);
      }
    } catch (error) {
      console.log("Error checking pending email changes:", error);
    }
  }

  // Call this on page load
  checkPendingEmailChanges();

  // Delete Account Modal
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const deleteAccountModal = document.getElementById("deleteAccountModal");
  const cancelAccountDelete = document.getElementById("cancelAccountDelete");
  const confirmAccountDeleteInput = document.getElementById(
    "confirmAccountDelete"
  );
  const confirmAccountDeleteBtn = document.getElementById(
    "confirmAccountDeleteBtn"
  );

  if (deleteAccountBtn && deleteAccountModal) {
    deleteAccountBtn.addEventListener("click", () => {
      deleteAccountModal.classList.add("active");
      confirmAccountDeleteInput.focus();
    });

    cancelAccountDelete.addEventListener("click", () => {
      deleteAccountModal.classList.remove("active");
      confirmAccountDeleteInput.value = "";
      confirmAccountDeleteBtn.disabled = true;
    });

    if (confirmAccountDeleteInput) {
      confirmAccountDeleteInput.addEventListener("input", (e) => {
        confirmAccountDeleteBtn.disabled =
          e.target.value !== "DELETE MY ACCOUNT";
      });
    }

    confirmAccountDeleteBtn.addEventListener("click", async () => {
      confirmAccountDeleteBtn.textContent = "Deleting...";
      confirmAccountDeleteBtn.disabled = true;

      try {
        const response = await fetch("/settings/delete-account/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            confirmation: confirmAccountDeleteInput.value,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert(
            "Your account has been successfully deleted. Redirecting to homepage..."
          );
          window.location.href = "/";
        } else {
          alert("Error: " + data.message);
          confirmAccountDeleteBtn.textContent = "Delete Account";
          confirmAccountDeleteBtn.disabled = false;
        }
      } catch (error) {
        alert("Error deleting account. Please try again.");
        confirmAccountDeleteBtn.textContent = "Delete Account";
        confirmAccountDeleteBtn.disabled = false;
      }
    });
  }

  // Add Clear All Chat functionality
  // Update the existing Clear All Chat functionality in settings.js
  const clearAllChatBtn = document.getElementById("clearAllChatBtn");
  if (clearAllChatBtn) {
    clearAllChatBtn.addEventListener("click", async () => {
      if (
        confirm(
          "Are you sure you want to clear ALL chat history? This will delete:\n\n• All backend chat history (permanent)\n• All local browser chat history\n• This action cannot be undone."
        )
      ) {
        clearAllChatBtn.textContent = "Clearing...";
        clearAllChatBtn.disabled = true;

        try {
          const response = await fetch("/settings/clear-all-chat/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCSRFToken(),
            },
          });

          const data = await response.json();

          if (data.success) {
            // Check if we should clear local storage too
            if (data.clear_local_storage) {
              // Clear local storage
              localStorage.removeItem("meditrack_chats");
              localStorage.removeItem("meditrack_chat_history");
              sessionStorage.removeItem("current_chat_session");

              alert(
                "✅ " +
                  data.message +
                  "\n\nFrontend chat history has also been cleared."
              );
            } else {
              alert("✅ " + data.message);
            }

            clearAllChatBtn.textContent = "Clear All Chats";
            clearAllChatBtn.disabled = false;

            // Optional: Reload the page to show empty state
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            alert("Error: " + data.message);
            clearAllChatBtn.textContent = "Clear All Chats";
            clearAllChatBtn.disabled = false;
          }
        } catch (error) {
          alert("Error clearing chat history. Please try again.");
          clearAllChatBtn.textContent = "Clear All Chats";
          clearAllChatBtn.disabled = false;
        }
      }
    });
  }

  // Close modals when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("active");
      // Reset forms
      if (changeEmailForm) changeEmailForm.reset();
      if (changePasswordForm) changePasswordForm.reset();
      if (confirmAccountDeleteInput) {
        confirmAccountDeleteInput.value = "";
        confirmAccountDeleteBtn.disabled = true;
      }
    }
  });

  // Close modals with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.classList.remove("active");
      });
      // Reset forms
      if (changeEmailForm) changeEmailForm.reset();
      if (changePasswordForm) changePasswordForm.reset();
      if (confirmAccountDeleteInput) {
        confirmAccountDeleteInput.value = "";
        confirmAccountDeleteBtn.disabled = true;
      }
    }
  });

  // ================ HELPER FUNCTIONS ================
  function getCSRFToken() {
    return (
      document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ||
      document.querySelector('meta[name="csrf-token"]')?.content
    );
  }

  function showPendingExportStatus() {
    const exportSettingItem = document.querySelector(
      '.setting-item:has(.setting-title:contains("Data Export"))'
    );
    if (exportSettingItem) {
      const description = exportSettingItem.querySelector(
        ".setting-description"
      );
      description.innerHTML = `
        <div style="margin-bottom: 10px;">
          Download all your health data and chat history
        </div>
        <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; border-left: 4px solid #1976d2;">
          <strong>🔄 Export Processing:</strong>
          <div style="margin-top: 5px;">
            Status: <strong>Processing</strong>
            <br>
            <small>You'll receive an email when your export is ready (usually within 5 minutes)</small>
          </div>
        </div>
      `;
    }
  }
});
