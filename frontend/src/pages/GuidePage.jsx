import AppShell from "../components/layout/AppShell";

const guideSections = [
  {
    title: "Using Your Vault",
    items: [
      {
        question: "How do I add a password?",
        answer:
          "Go to Add Password, enter the account login, website name, website URL, and password details, then click Save.",
      },
      {
        question: "What is the difference between website name and URL?",
        answer:
          "Website Name is the label shown in your vault. Website URL is the actual site address, such as https://github.com.",
      },
      {
        question: "How do I find a password?",
        answer:
          "Use the search bar on the All Passwords page to filter saved credentials by website name or website URL.",
      },
      {
        question: "How do I view, copy, edit, or delete a password?",
        answer:
          "Select a saved password from your vault. The details modal lets you reveal or copy the password, edit the entry, or delete it.",
      },
    ],
  },
  {
    title: "Security And Vault Locking",
    items: [
      {
        question: "Why does my vault lock after refreshing?",
        answer:
          "Your vault key is kept in memory only. After a refresh, you can stay signed in, but you must unlock the vault again before viewing password details.",
      },
      {
        question: "What data is encrypted?",
        answer:
          "Saved password details and notes are encrypted before storage. Website name, URL, and username are stored as searchable metadata.",
      },
      {
        question: "Should I use the password generator?",
        answer:
          "Yes. Unique generated passwords are safer than reusing the same password across multiple accounts.",
      },
    ],
  },
  {
    title: "Multi-Factor Authentication",
    items: [
      {
        question: "How does MFA work?",
        answer:
          "MFA adds a one-time code from an authenticator app when you sign in. Codes usually refresh about every 30 seconds.",
      },
      {
        question: "How do I set up MFA?",
        answer:
          "Open Account Settings, generate a QR code, scan it with an authenticator app, then enter the current 6-digit code to verify setup.",
      },
      {
        question: "What if I cannot scan the QR code?",
        answer:
          "Use the manual setup key shown below the QR code and enter it into your authenticator app.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        question: "My MFA code was rejected. What should I try?",
        answer:
          "Use the newest code from your authenticator app and make sure your device clock is set automatically.",
      },
      {
        question: "Why did my URL change after saving?",
        answer:
          "The app normalizes website URLs so entries save consistently, for example changing github.com to https://github.com.",
      },
      {
        question: "How do I end my session?",
        answer:
          "Click Logout in the navigation menu. This clears your token and in-memory vault key.",
      },
    ],
  },
  {
    title: "How The App Works",
    items: [
      {
        question: "What happens when I register?",
        answer:
          "The app derives login and encryption keys in the browser. The backend stores the data it needs to verify your login, but it does not receive your plain master password.",
      },
      {
        question: "How are saved passwords protected?",
        answer:
          "Password details are encrypted in the frontend before being sent to the backend. The backend stores the encrypted blob, initialization vector, and searchable metadata.",
      },
      {
        question: "Why does the app use both frontend and backend code?",
        answer:
          "The React frontend handles the user interface and client-side encryption. The FastAPI backend handles accounts, authentication, MFA, and saving encrypted vault rows in Supabase.",
      },
      {
        question: "How does the database stay scoped to my account?",
        answer:
          "Vault rows are tied to the logged-in user, and Supabase row-level security is used as an extra database-side protection layer.",
      },
    ],
  },
];

export default function GuidePage() {
  return (
    <AppShell>
      <section className="guide-page">
        <header className="guide-page__header">
          <h1>Documentation</h1>
          <p>Quick help for using Password Protector during everyday tasks.</p>
        </header>

        {guideSections.map((section) => (
          <section className="guide-page__section" key={section.title}>
            <h2>{section.title}</h2>
            <div className="guide-page__faq">
              {section.items.map((item) => (
                <article className="guide-page__faq-row" key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </AppShell>
  );
}
