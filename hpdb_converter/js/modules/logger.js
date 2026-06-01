export function createLogger(state) {
  return {
    setMessage(message) {
      state.logMessage = message;
    },
    appendMessage(message) {
      state.logMessage = state.logMessage ? `${state.logMessage}\n${message}` : message;
    },
    clear() {
      state.logMessage = "";
    },
    setFromLines(lines) {
      state.logMessage = Array.isArray(lines) ? lines.filter(Boolean).join("\n") : "";
    },
  };
}