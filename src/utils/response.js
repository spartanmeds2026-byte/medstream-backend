export function response (code, message) {
  const response = {
    data: message,
    code
  }

  return response
}
