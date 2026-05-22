import React, { useState } from 'react';
// Totp input form that renders when a user with MFA logs in
const TotpInput = ({ onSubmit }) => {
  const [code, setCode] = useState('');

  const handleChange = (e) => {
    // Only allow numbers and max length of 6
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="totp-modal">
        <h3>Two-Factor Authentication</h3>
        <p>Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column"}}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={handleChange}
            placeholder="000000"
            className="totp-field"
          />
          <button className="auth-page__button" style={{alignSelf:"center", marginTop:"1rem"}} type="submit" disabled={code.length < 6}>
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};


export default TotpInput