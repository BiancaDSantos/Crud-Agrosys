import { EncryptionService } from "../core/security/EncryptionService.js";
import { QueryBuilder } from "../core/database/QueryBuilder.js";
import { SecureStorage } from "../core/security/SecureStorage.js";

export class SecureClientRepository {
    static tableName = 'clientes';

    /**
     * Salva um cliente protegendo todos os seus dados.
     */
    static async create(clientData) {

        const cpfLimpo = clientData.cpf.replace(/\D/g, '');
        const cpfHash = await EncryptionService.hash(cpfLimpo);

        const currentUser = SecureStorage.getItem('currentUser');

        const encryptedData = {
            usuario_id: currentUser,
            nome_completo: await EncryptionService.encrypt(clientData.nome_completo),
            cpf: await EncryptionService.encrypt(cpfLimpo),
            cpf_hash: cpfHash,
            data_nascimento: await EncryptionService.encrypt(clientData.data_nascimento),
            telefone: await EncryptionService.encrypt(clientData.telefone),
            celular: await EncryptionService.encrypt(clientData.celular)
        };

        return QueryBuilder.insert(this.tableName, encryptedData);
    }

    /**
     * Retorna a lista de clientes, descriptografando-os em tempo real para a Interface.
     */
    static async findAll() {

        const currentUser = SecureStorage.getItem('currentUser');

        const rawData = await QueryBuilder.select(this.tableName);

        if (!rawData || rawData.length === 0) return [];

        const userClients = rawData.filter(client => client.usuario_id === currentUser);

        const decryptedClients = await Promise.all(userClients.map(async (item) => {
            try {
                const nome = await EncryptionService.decrypt(item.nome_completo);
                const cpf = await EncryptionService.decrypt(item.cpf);
                const celular = await EncryptionService.decrypt(item.celular);
                const nascimento = await EncryptionService.decrypt(item.data_nascimento);
                const telefone = await EncryptionService.decrypt(item.telefone);

                console.log(`🔑 [REPO] Sucesso ao abrir:`, { nome });

                return {
                    id: item.id,
                    cpf_hash: item.cpf_hash, 
                    nome_completo: nome,
                    cpf: cpf,
                    celular: celular,
                    data_nascimento: nascimento,
                    telefone: telefone
                };
            } catch (error) {
                console.warn(`⚠️ [REPO] Ignorando registro antigo/corrompido:`, item.cpf_hash);
                return null;
            }
        }));

        return decryptedClients.filter(client => client !== null);
    }

    /**
     * Verifica se já existe um cliente com o mesmo hash de CPF.
     */
    static async findByCpfHash(cpfHash) {

        const currentUser = SecureStorage.getItem('currentUser');
        console.log(currentUser)
        const allClients = await QueryBuilder.select(this.tableName);

        if (!allClients || allClients.length === 0) return null;

        const existingClient = allClients.find(client => 
            client.cpf_hash === cpfHash && client.usuario_id === currentUser
        );

        return existingClient || null;

    }

    /**
     * Remove um cliente do banco de dados pelo seu ID.
     */
    static async delete(hash) {
        return await QueryBuilder.delete('clientes', `cpf_hash = '${hash}'`);
    }

    /**
     * Atualiza os dados de um cliente existente, mantendo o isolamento de segurança.
     */
    static async update(oldHash, clientData) {

        const cpfLimpo = clientData.cpf.replace(/\D/g, '');
        const novoCpfHash = await EncryptionService.hash(cpfLimpo);
        const currentUser = SecureStorage.getItem('currentUser');

        const encryptedData = {
            nome_completo: await EncryptionService.encrypt(clientData.nome_completo),
            cpf: await EncryptionService.encrypt(cpfLimpo),
            cpf_hash: novoCpfHash,
            data_nascimento: await EncryptionService.encrypt(clientData.data_nascimento),
            telefone: await EncryptionService.encrypt(clientData.telefone),
            celular: await EncryptionService.encrypt(clientData.celular)
        };

        return await QueryBuilder.update(
            this.tableName, 
            encryptedData, 
            `cpf_hash = '${oldHash}' AND usuario_id = '${currentUser}'`
        );
    }
    
}