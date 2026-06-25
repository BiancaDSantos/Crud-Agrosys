import { User } from '../domain/User.js';
import { SecureUserRepository } from '../repositories/SecureUserRepository.js';
import { EncryptionService } from '../core/security/EncryptionService.js';
import { KeyManager } from '../core/security/KeyManager.js';
import { SecureStorage } from '../core/security/SecureStorage.js';
import { SessionManager } from '../core/security/SessionManager.js';

export class AuthService {

    /**
    * Registra um novo usuário no sistema
    * @param {Object} rawData
    */
    static async register(rawData) {
        try {

            const user = new User(rawData);
            const { username, password } = user.toJSON();

            const usernameHash = await EncryptionService.hash(username);

            const existingUser = await SecureUserRepository.findByUsername(username);
            if (existingUser) {
                throw new Error('Não foi possível realizar o cadastro. O nome de usuário já está em uso.');
            }

            const salt = await EncryptionService.hash(username + Date.now().toString());
            const passwordHash = await EncryptionService.hash(password + salt);

            const userData = {
                username_hash: usernameHash,
                username: username,
                password_salt: salt,
                password_hash: passwordHash
            };

            await SecureUserRepository.create(userData);

            return { success: true, message: "Usuário registrado com sucesso!" };

        } catch (error) {
            console.error("Erro no registro:", error);
            throw error;
        }
    }

    /**
     * Realiza login do usuário
     * *@param {Object} rawData
     */
    /**
     * Realiza login do usuário
     * @param {Object} rawData
     */
    static async login(rawData) {

        const user = new User(rawData);
        const { username, password } = user.toJSON();

        const userData = await SecureUserRepository.findByUsername(username);

        if (!userData) {
            throw new Error('Credenciais inválidas.');
        }

        const attemptedHash = await EncryptionService.hash(password + userData.password_salt);
        if (attemptedHash !== userData.password_hash) {
            throw new Error('Credenciais inválidas.');
        }

        const cryptoKey = await EncryptionService.deriveKey(password, username);
        const exportedKey = await window.crypto.subtle.exportKey("jwk", cryptoKey);

        SecureStorage.setItem('sessionKey', JSON.stringify(exportedKey));
        KeyManager.setKey(cryptoKey);
        SecureStorage.setItem('isAuthenticated', true);
        SecureStorage.setItem('currentUser', username);
        
        SessionManager.start();

        return userData;
    }
    static async restoreSessionKey() {

        const keyData = SecureStorage.getItem('sessionKey');
        if (!keyData) {
            console.warn("⚠️ [RESTORE] 3. ALERTA: Nenhuma chave 'sessionKey' foi encontrada no Storage! O login salvou a chave?");
            return;
        }

        try {

            const jwk = typeof keyData === 'string' ? JSON.parse(keyData) : keyData;

            const cryptoKey = await window.crypto.subtle.importKey(
                "jwk",
                jwk,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            KeyManager.setKey(cryptoKey);

        } catch (error) {
            console.error("Erro ao restaurar a chave de sessão:", error);
        }

    }

    static logout() {
        SessionManager.logout();
    }

}