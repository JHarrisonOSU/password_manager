import AppShell from "../components/layout/AppShell";

const guideItems = [
  {
    question: "What is Password Protector?",
    answer:
      "Password Protector is a secure password manager that helps you store, organize, and access your saved account credentials.",
  },
  {
    question: "How do I add a password?",
    answer:
      "Go to Add Password, enter the account login, website, and password details, then click Save to add it to your vault.",
  },
  {
    question: "How do I find a password?",
    answer:
      "Use the search bar on the All Passwords page to quickly filter your saved credentials by website or account login.",
  },
  {
    question: "How do I edit or delete a password?",
    answer:
      "Select a saved password from your vault to view its details, make changes, or delete it from your account.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your saved password data is protected using encryption so your credentials remain private and secure.",
  },
  {
    question: "How do I log out?",
    answer:
      "Click the Logout button in the navigation menu to securely end your session.",
  },
];

export default function GuidePage() {
  return (
    <AppShell>
      <section className="guide-page">
        <header className="guide-page__header">
          <h1>Documentation</h1>
          <p>Frequently asked questions about using Password Protector.</p>
        </header>

        <div className="guide-page__faq">
          {guideItems.map((item) => (
            <article className="guide-page__faq-row" key={item.question}>
              <h2>{item.question}</h2>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
