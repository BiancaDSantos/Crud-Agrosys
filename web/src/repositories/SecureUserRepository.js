import { EncryptionService } from '../core/security/EncryptionService.js';
import { QueryBuilder } from '../core/database/QueryBuilder.js';

export class SecureUserRepository {

    static tableName = 'usuarios';

    /**
     * Salva um novo usuário.
     * @param {Object} userData - { username_hash, username, password_salt, password_hash }
     */
    static async create(userData) {
        const existingUser = await this.findByUsername(userData.username);

        if (existingUser) {
            throw new Error('Não foi possível realizar o cadastro. O nome de usuário já está em uso.');
        }

        return await QueryBuilder.insert(this.tableName, userData);
    }

    /**
     * Busca as credenciais de um usuário pelo hash do nome de usuário.
     * @param {string} username 
     */
    static async findByUsername(username) {
        
        const normalizedUsername = username.trim().toLowerCase();
        const usernameHash = await EncryptionService.hash(normalizedUsername);

        const users = await QueryBuilder.select(this.tableName);
        
        if (!users || users.length === 0) return null;

        const existingUser = users.find((user) => {
            return user && (
                user.username_hash === usernameHash ||
                user.username?.trim().toLowerCase() === normalizedUsername
            );
        });

        return existingUser || null;

    }

}