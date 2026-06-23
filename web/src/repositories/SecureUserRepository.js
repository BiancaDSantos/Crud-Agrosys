import { EncryptionService } from '../core/security/EncryptionService.js';
import { QueryBuilder } from '../core/database/QueryBuilder.js';

export class SecureUserRepository {

    static tableName = 'usuarios';

    /**
     * Salva um novo usuário. 
     * Username é "hasheado" para manter a privacidade e permitir a busca exata no login.
     * @param {Object} userData - { username, password_salt, password_hash }
     */
    static async create(userData) {

        console.log("🔍 Dados chegando no Repositório:", userData);

        const userHash = await EncryptionService.hash(userData.username.toLowerCase());

        const dataToInsert = {
            username_hash: userHash,
            username: userData.username,
            password_salt: userData.password_salt,
            password_hash: userData.password_hash
        };

        console.log("🚀 Dados formatados para o banco:", dataToInsert);

        return QueryBuilder.insert(this.tableName, dataToInsert);
    }

    /**
     * Busca as credenciais de um usuário pelo seu nome de usuário.
     * @param {string} username 
     */
    static async findByUsername(username) {
        console.log(`🔎 1. Iniciando busca pelo usuário: "${username}"`);
        
        // Gera o hash
        const usernameHash = await EncryptionService.hash(username.toLowerCase());
        console.log(`🔑 2. Hash esperado para a busca:`, usernameHash);

        // Busca no banco
        const query = `SELECT * FROM ${this.tableName}`;
        const allUsers = await alasql.promise(query);
        
        console.log(`📦 3. O que o AlaSQL achou no banco agora?`, allUsers);

        if (!allUsers || allUsers.length === 0) {
            console.warn(`⚠️ 4. ALERTA: O banco retornou VAZIO ou UNDEFINED para a leitura!`);
            return null;
        }

        const flatUsers = allUsers.map(wrapper => Object.values(wrapper)[0]);

        const user = flatUsers.find(u => u && u.username_hash === usernameHash);
        
        if (user) {

            console.log(`✅ 5. Usuário ENCONTRADO no .find():`, user);

        } else {

            console.warn(`❌ 6. Nenhum usuário bateu com o hash procurado.`);
            console.log(`Comparação -> O que tem no banco:`, allUsers.map(u => u.username_hash));

        }

        return user || null;
    }

}