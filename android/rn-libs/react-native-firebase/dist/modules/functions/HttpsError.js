

export default class HttpsError extends Error {
  constructor(code, message, details) {
    super(message);
    this.details = details;
    this.code = code;
  }
}