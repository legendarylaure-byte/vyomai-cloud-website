# Security Rules

## Never hardcode secrets
- NEVER write real passwords, API keys, tokens, or secrets in any plan file, documentation, or code
- Always use placeholders like `<your-password>`, `YOUR_API_KEY_HERE`, or env var references
- If a secret appears in conversation, do not write it to any file

## File types never to commit
- `.env`, `.env.*`, `.env*.local` files
- `keys/`, `certs/` directory contents
- `*.pem`, `*.key`, `*.p12`, `*.pfx` files
- Any file containing the word `secret` or `credential` in the name

## Verification
- Before writing any file, double-check it contains no real secret values
- Plan files should use `ADMIN_PASSWORD_PLACEHOLDER` or `your_secure_password` style references
