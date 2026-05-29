export function generatePasswordSuggestion(basePassword = "", length = 32) {
  // Mix any user-entered seed with random characters for a quick suggestion.
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*";
  const remaining = Math.max(length - basePassword.length, 0);
  const array = new Uint32Array(remaining);
  let generated = basePassword;

  window.crypto.getRandomValues(array);

  for (let i = 0; i < remaining; i++) {
    generated += chars[array[i] % chars.length];
  }

  return generated
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
