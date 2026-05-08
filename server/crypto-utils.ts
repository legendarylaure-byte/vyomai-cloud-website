import crypto from 'crypto';

/**
 * Encryption utility for securely storing OAuth tokens and API keys
 * Uses AES-256-GCM encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (NOT SECURE FOR PRODUCTION)
 */
function getEncryptionKey(): string {
    const key = process.env.SOCIAL_MEDIA_ENCRYPTION_KEY;

    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SOCIAL_MEDIA_ENCRYPTION_KEY must be set in production');
        }
        console.warn('⚠️ Using default encryption key for development. Set SOCIAL_MEDIA_ENCRYPTION_KEY in production!');
        return 'dev_encryption_key_change_in_production_32chars!!';
    }

    return key;
}

/**
 * Derive a cryptographic key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data (OAuth tokens, API keys, secrets)
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
    try {
        const encryptionKey = getEncryptionKey();

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive key from password and salt
        const key = deriveKey(encryptionKey, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const tag = cipher.getAuthTag();

        // Return format: salt:iv:tag:encryptedData
        return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
    try {
        const encryptionKey = getEncryptionKey();

        // Parse the encrypted data
        const parts = encryptedData.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format');
        }

        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];

        // Derive key from password and salt
        const key = deriveKey(encryptionKey, salt);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt the text
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash sensitive data for comparison (e.g., webhook secrets)
 * @param text - Text to hash
 * @returns SHA-256 hash (hex encoded)
 */
export function hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random secret key (for webhook secrets, etc.)
 * @param length - Length of the secret in bytes (default: 32)
 * @returns Random hex string
 */
export function generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Securely compare two strings (constant-time comparison to prevent timing attacks)
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    return crypto.timingSafeEqual(bufferA, bufferB);
}
