import AppShell from "../components/layout/AppShell";
import { useState } from "react";
import authAPI from "../services/authService"
import {QRCodeSVG} from 'qrcode.react';

export default function AccountSettingsPage() {
  const [qr, setQr] = useState(null)
  const [mfaCode, setMfaCode] = useState("")

  async function createQRCode(){
    // Displays the QR code for user's to scan with authenticator application. Once a user scans the code,
    // the account is created and connected to the authenticator app. This is the first step to enabling MFA.
    const token = localStorage.getItem('token')
    try {

      const response = await fetch(`${authAPI}/mfa/setup`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          }
        })
    if (response.status == 409) {
      console.log("MFA Already Enabled")
      return
    }
    
    if (!response.ok) {
      console.log("Failed to setup MFA")
      return 
    }
    
    const setupData = await response.json()
    setQr(setupData["totp_uri"])
    } catch (err) {
      console.error(err.message)
    }
  }

  async function verifyQRCode() {
  // Verifies the setup between authenticator app and backend. Once a user scans the QR code displayed by createQRCode()
    const token = localStorage.getItem("token")
    try {
      const MFAVerifyRes = await fetch(`${authAPI}/mfa/verify-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: mfaCode
        })
      })
    } catch (err) {
      console.error(err.message)
    }
  }

  async function checkMFAEnbaled() {
  // Used during debugging to check user's jwt info
    const token = localStorage.getItem("token")

    const response = await fetch(`${authAPI}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const data = await response.json()
    // console.log(data)
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
