import validator from "validator";

export function getPasswordValidationError(password) {
  if (typeof password !== "string" || !password.trim()) {
    return "Password is required";
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 UTF-8 bytes";
  }

  if (!validator.isStrongPassword(password, {
    minLength: 10,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })) {
    return "Password must be at least 10 characters long and contain an uppercase letter, lowercase letter, number, and special character";
  }

  return null;
}
