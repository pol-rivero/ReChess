
export class RechessError extends Error {
  public readonly code: ErrorToken
  static locale: ErrorLocale = 'en'
  private params: Record<string, string> = {}
  
  constructor(code: ErrorToken, params?: Record<string, string>) {
    super(`RechessError: ${code}`)
    this.code = code
    if (params) this.params = params
  }
  
  static setLocale(locale: ErrorLocale) {
    this.locale = locale
  }
  
  get localizedMessage() {
    let text = LOCALES[RechessError.locale][this.code]
    // Format the text with the params
    for (const [key, value] of Object.entries(this.params)) {
      text = text.replace(`{${key}}`, value)
    }
    return text
  }
}


const ERROR_TOKENS = [
  'EMAIL_ALREADY_IN_USE',
  'CANNOT_CREATE_USER',
  'WRONG_PASSWORD',
  'WRONG_PASSWORD_PROVIDER',
] as const

export type ErrorToken = typeof ERROR_TOKENS[number]

// Add here other locales

export type ErrorLocale = 'en'

const LOCALES: Record<ErrorLocale, Record<ErrorToken, string>> = {
  'en': {
    'EMAIL_ALREADY_IN_USE': 'This email is already in use, please use a different one',
    'CANNOT_CREATE_USER': 'Could not create the user profile, try again later',
    'WRONG_PASSWORD': 'The password is incorrect',
    'WRONG_PASSWORD_PROVIDER': 'This email is linked to a {provider} account, please use the correct button to log in',
  },
}