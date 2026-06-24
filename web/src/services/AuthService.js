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
            // Extraímos os dados de dentro do objeto que veio do Controller!
            const { username, password } = rawData;

            console.log("1. Entrou no handleRegister");
            console.log("2. Dados capturados:", { username, password });
            
            // ✅ VERIFICA SE O USUÁRIO JÁ EXISTE
            const existingUser = await SecureUserRepository.findByUsername(username);
            if (existingUser) {
                throw new Error(`Usuário "${username}" já está cadastrado.`);
            }
            console.log(`AQUUUUIIIIIIIII -> ${existingUser}`)
            
            console.log("4. Chamado AuthService.register...");
            
            // Gera salt e hash da senha
            const salt = await EncryptionService.hash(username + Date.now().toString());
            const passwordHash = await EncryptionService.hash(password + salt);
            
            const userData = {
                username: username,
                password_salt: salt,
                password_hash: passwordHash
            };
            
            // Salva o usuário
            await SecureUserRepository.create(userData);
            
            console.log("5. Serviço finalizou com sucesso!");
            
            return { success: true, message: "Usuário registrado com sucesso!" };
            
        } catch (error) {
            console.error("Erro no registro:", error);
            throw error; // Repassa o erro para o Controller exibir a tela rosa
        }
    }

    /**
     * Registra um novo usuário no sistema
     * *@param {Object} rawData
     */
    static async login(rawData) {

        const user = new User(rawData);
        const { username, password } = user.toJSON();

        const userData = await SecureUserRepository.findByUsername(username);
        if (!userData) throw new Error('Credenciais inválidas.');

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

        return { success: true, username };

    }

    /**
     * Restaura a chave de criptografia da sessão após um reload de página
     */
    static async restoreSessionKey() {

        console.log("🔄 [RESTORE] 1. Iniciando tentativa de restauração da chave...");
        const keyData = SecureStorage.getItem('sessionKey');
        console.log("📦 [RESTORE] 2. Dados brutos lidos do Storage:", keyData);
        if (!keyData) {

            console.warn("⚠️ [RESTORE] 3. ALERTA: Nenhuma chave 'sessionKey' foi encontrada no Storage! O login salvou a chave?");
            return;
        }

        try {

            const jwk = typeof keyData === 'string' ? JSON.parse(keyData) : keyData;

            console.log("🧩 [RESTORE] 4. JWK convertido com sucesso:", jwk);
            
            const cryptoKey = await window.crypto.subtle.importKey(
                "jwk",
                jwk,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            
            KeyManager.setKey(cryptoKey);

            console.log("🛡️ [RESTORE] 5. CryptoKey recriado pelo navegador:", cryptoKey);
        } catch (error) {
            console.error("Erro ao restaurar a chave de sessão:", error);
        }

    }

    static logout() {
        SessionManager.logout();
    }

}