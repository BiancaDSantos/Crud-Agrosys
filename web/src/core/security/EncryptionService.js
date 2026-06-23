import { KeyManager } from './KeyManager.js';

export class EncryptionService {
    
    /**
     * Deriva uma chave AES-256 a partir de uma senha em texto plano.
     * Utiliza PBKDF2 com 100.000 iterações (Padrão de segurança robusto).
     * @param {string} password 
     * @param {string} salt (Pode ser o username do usuário)
     * @returns {Promise<CryptoKey>}
     */
    static async deriveKey(password, salt) {

        if (!password || !salt) {
            throw new Error("[EncryptionService] Senha e salt são obrigatórios para derivar a chave.");
        }

        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        return derivedKey;
    }

    /**
     * Criptografa um texto usando AES-256-GCM.
     * @param {string} text 
     * @returns {Promise<string>}
     */
    static async encrypt(text) {
        if (!text) return text;
        
        const key = KeyManager.getKey();
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);
        
        // O AES-GCM exige um Vetor de Inicialização (IV) único de 12 bytes para cada criptografia
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const ciphertextBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encodedText
        );

        const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertextBuffer), iv.length);

        return this.#arrayBufferToBase64(combined.buffer);
    }

    /**
     * Descriptografa uma string Base64 contendo IV + Ciphertext.
     * @param {string} encryptedBase64 
     * @returns {Promise<string>}
     */
    static async decrypt(encryptedBase64) {

        try {
            if (!encryptedBase64) return encryptedBase64;

            const key = KeyManager.getKey();
            const combinedBuffer = this.#base64ToArrayBuffer(encryptedBase64);
            const combined = new Uint8Array(combinedBuffer);

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);

        } catch (error) {
            throw new Error("Falha na descriptografia. Os dados podem estar corrompidos ou a sessão é inválida.");
        }
    }

    /**
     * Gera um Hash SHA-256 para buscas exatas (ex: CPF) sem expor o dado.
     * @param {string/number} text 
     * @returns {Promise<string>} String em Hexadecimal
     */
    static async hash(text) {

        if (!text) return text;
        
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
    }

    // --- Métodos Utilitários Privados ---

    static #arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    static #base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}