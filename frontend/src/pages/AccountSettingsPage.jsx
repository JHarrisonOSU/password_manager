import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../lib/useAuth";
import {
  getCurrentUser,
  setupMfa,
  verifyMfaSetup,
} from "../services/authService";

const showDebugTools = import.meta.env.VITE_SHOW_DEBUG_TOOLS === "true";

export default function AccountSettingsPage() {
  const { token, user } = useAuth();
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(Boolean(user?.mfa_enabled));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [debugMessage, setDebugMessage] = useState("");

  async function checkUserInfo() {
    setDebugMessage("");
    setError("");

    try {
      // Local-only debug helper for checking the current /auth/me response.
      const currentUser = await getCurrentUser(token);
      setDebugMessage(JSON.stringify(currentUser, null, 2));
    } catch (err) {
      setError(err.message || "Could not load user info.");
    }
  }

  async function createQRCode() {
    setError("");
    setSuccessMessage("");
    setIsGeneratingQr(true);

    try {
      // The backend creates a pending TOTP secret and returns the QR/manual key.
      const setupData = await setupMfa(token);
      setQrCodeUri(setupData.totp_uri);
      setManualSecret(setupData.secret);
    } catch (err) {
      setError(err.message || "Could not start MFA setup.");
    } finally {
      setIsGeneratingQr(false);
    }
  }

  async function verifyQRCode() {
    setError("");
    setSuccessMessage("");

    if (!mfaCode.trim()) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsVerifyingCode(true);

    try {
      // Verifying the first code flips MFA on for this account.
      await verifyMfaSetup(token, mfaCode.trim());
      setIsMfaEnabled(true);
      setQrCodeUri("");
      setManualSecret("");
      setMfaCode("");
      setSuccessMessage("MFA enabled successfully.");
    } catch (err) {
      setError(err.message || "Could not verify MFA setup.");
    } finally {
      setIsVerifyingCode(false);
    }
  }

  return (
    <AppShell>
      <section className="account-settings-page">
        <header className="account-settings-page__header">
          <h1>Account Settings</h1>
          <p>Manage extra security settings for your account.</p>
        </header>

        <div className="account-settings-page__layout">
          <div className="account-settings-page__main">
            <section className="mfa-settings" aria-labelledby="mfa-heading">
              <div className="mfa-settings__intro">
                <div>
                  <h2 id="mfa-heading">Multi-factor authentication</h2>
                  <p>
                    Add a one-time code from an authenticator app when signing
                    in.
                  </p>
                </div>
                <span
                  className={`mfa-settings__status ${
                    isMfaEnabled
                      ? "mfa-settings__status--enabled"
                      : "mfa-settings__status--disabled"
                  }`}
                >
                  {isMfaEnabled ? "Enabled" : "Not Enabled"}
                </span>
              </div>

              {!isMfaEnabled ? (
                <>
                  <ol className="mfa-settings__steps">
                    <li>Generate a QR code.</li>
                    <li>Scan it with your authenticator app.</li>
                    <li>Enter the 6-digit code from the app.</li>
                    <li>Verify setup.</li>
                  </ol>

                  <button
                    className="mfa-settings__button"
                    type="button"
                    onClick={createQRCode}
                    disabled={isGeneratingQr || isVerifyingCode}
                  >
                    {isGeneratingQr ? "Generating..." : "Generate QR Code"}
                  </button>

                  {qrCodeUri ? (
                    <div className="mfa-settings__setup">
                      <div className="mfa-settings__qr">
                        <QRCodeSVG value={qrCodeUri} size={160} />
                      </div>

                      {manualSecret ? (
                        <div className="mfa-settings__manual">
                          <p>Can’t scan? Enter this setup key manually:</p>
                          <code>{formatSecret(manualSecret)}</code>
                        </div>
                      ) : null}

                      <div className="mfa-settings__verify-row">
                        <label className="mfa-settings__field">
                          <span>Verification Code:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={mfaCode}
                            onChange={(event) =>
                              setMfaCode(event.target.value)
                            }
                            disabled={isVerifyingCode}
                            placeholder="123456"
                          />
                        </label>

                        <button
                          className="mfa-settings__button"
                          type="button"
                          onClick={verifyQRCode}
                          disabled={isVerifyingCode}
                        >
                          {isVerifyingCode
                            ? "Verifying..."
                            : "Verify MFA Setup"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mfa-settings__enabled-copy">
                  MFA is active. You will be asked for an authenticator code the
                  next time you sign in.
                </p>
              )}

              {error ? (
                <p className="account-settings-form__error">{error}</p>
              ) : null}
              {successMessage ? (
                <p className="account-settings-form__success">
                  {successMessage}
                </p>
              ) : null}
            </section>

            {showDebugTools ? (
              <section className="account-settings-debug">
                <h2>Debug Tools</h2>
                <button
                  className="mfa-settings__button"
                  type="button"
                  onClick={checkUserInfo}
                >
                  Check User Info
                </button>
                {debugMessage ? <pre>{debugMessage}</pre> : null}
              </section>
            ) : null}
          </div>

          {/* This keeps the settings page aligned with other dashboard side panels. */}
          <aside className="account-settings-summary" aria-label="Security tips">
            <h2>Security Tips</h2>
            <ul>
              <li>Use MFA with an authenticator app instead of SMS.</li>
              <li>Keep your device clock set automatically for fresh codes.</li>
              <li>Logging out clears the local vault key from this browser.</li>
            </ul>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function formatSecret(secret) {
  // Group the setup key so it is easier to copy into an authenticator app.
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}
