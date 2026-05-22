import AppShell from "../components/layout/AppShell";
import { useState } from "react";
import {
  getCurrentUser,
  setupMfa,
  verifyMfaSetup,
} from "../services/authService";
import {QRCodeSVG} from 'qrcode.react';

export default function AccountSettingsPage() {
  const [qr, setQr] = useState(null)
  const [mfaCode, setMfaCode] = useState("")

  async function createQRCode(){
    // Displays the QR code for user's to scan with authenticator application. Once a user scans the code,
    // the account is created and connected to the authenticator app. This is the first step to enabling MFA.
    const token = localStorage.getItem('token')
    try {
      const setupData = await setupMfa(token)
      setQr(setupData["totp_uri"])
    } catch (err) {
      console.error(err.message)
    }
  }

  async function verifyQRCode() {
  // Verifies the setup between authenticator app and backend. Once a user scans the QR code displayed by createQRCode()
    const token = localStorage.getItem("token")
    try {
      await verifyMfaSetup(token, mfaCode)
    } catch (err) {
      console.error(err.message)
    }
  }

  async function checkMFAEnbaled() {
  // Used during debugging to check user's jwt info
    const token = localStorage.getItem("token")
    await getCurrentUser(token)
  }


  return (
    <AppShell>
      <section className="account-settings-page">
        <header className="account-settings-page__header">
          <h1>Account Settings</h1>
          <button onClick={()=>checkMFAEnbaled()}>USER INFO</button>
          <p>Enable MFA</p>
          <button
            onClick={()=>createQRCode()}>
              Get QR Code
          </button>
          {qr && <QRCodeSVG value={qr} size={128} />} 
          <div>
            <input type="text"
              onChange={(e)=>setMfaCode(e.target.value)}>
            </input>
            <button onClick={()=>verifyQRCode()}>Verify MFA Setup</button>
          </div>
        </header>
      </section>
    </AppShell>
  );
}
