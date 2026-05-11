import { useState } from "react";
import AppShell from "../components/layout/AppShell";

const initialFormData = {
  accountLogin: "",
  website: "",
  password: "",
  verifyPassword: "",
};

export default function AddPasswordPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    // TODO: Add frontend validation here before sending to backend.
    // Example checks: required fields, valid website format, password match.
    setErrors({});

    // TODO: Send the validated password data to the backend.
    console.log("Add password form submitted:", formData);
  }

  return (
    <AppShell>
      <section className="add-password-page">
        <form className="add-password-form" onSubmit={handleSubmit}>
          <label className="add-password-form__field">
            <span>Account Login:</span>
            <input
              type="text"
              name="accountLogin"
              value={formData.accountLogin}
              onChange={handleInputChange}
              placeholder="email@gmail.com"
            />
          </label>

          <label className="add-password-form__field">
            <span>Website:</span>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="www.gmail.com"
            />
          </label>

          <label className="add-password-form__field">
            <span>Password:</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="**************"
            />
          </label>

          <label className="add-password-form__field">
            <span>Verify Password</span>
            <input
              type="password"
              name="verifyPassword"
              value={formData.verifyPassword}
              onChange={handleInputChange}
              placeholder="**************"
            />
          </label>

          {errors.form ? (
            <p className="add-password-form__error">{errors.form}</p>
          ) : null}

          <button className="add-password-form__button" type="submit">
            Save
          </button>
        </form>
      </section>
    </AppShell>
  );
}
