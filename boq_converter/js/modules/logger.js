import { appendLog, setLogs } from "./state.js";

export function createLogger(state) {
  return {
    setMessage(message) {
      setLogs(state, [message]);
    },
    setFromLines(lines) {
      setLogs(state, lines);
    },
    append(message) {
      appendLog(state, message);
    },
    clear() {
      setLogs(state, []);
    },
  };
}
