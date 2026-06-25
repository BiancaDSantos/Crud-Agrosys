import { EncryptionService } from "../core/security/EncryptionService.js";
import { QueryBuilder } from "../core/database/QueryBuilder.js";
import { SecureStorage } from "../core/security/SecureStorage.js";

export class SecureClientRepository {

    static tableName = 'clientes';

    static #getUserId() {
        const session = SecureStorage.getItem('currentUser');
        return session?.id || session?.username || session;
    }

    static async create(clientData) {

        const cpfLimpo = clientData.cpf.replace(/\D/g, '');
        const cpfHash = await EncryptionService.hash(cpfLimpo);
        const userId = this.#getUserId();

        const encryptedData = {
            usuario_id: userId,
            nome_completo: await EncryptionService.encrypt(clientData.nome_completo),
            cpf: await EncryptionService.encrypt(cpfLimpo),
            cpf_hash: cpfHash,
            data_nascimento: await EncryptionService.encrypt(clientData.data_nascimento),
            telefone: await EncryptionService.encrypt(clientData.telefone),
            celular: await EncryptionService.encrypt(clientData.celular)
        };

        return QueryBuilder.insert(this.tableName, encryptedData);
    }

    static async findAll() {

        const userId = this.#getUserId();
        const rawData = await QueryBuilder.select(this.tableName);

        if (!rawData || rawData.length === 0) return [];

        const userClients = rawData.filter(client => String(client.usuario_id) === String(userId));

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

    static async findByCpfHash(cpfHash) {

        const userId = this.#getUserId();
        const allClients = await QueryBuilder.select(this.tableName);

        if (!allClients || allClients.length === 0) return null;

        const existingClient = allClients.find(client => 
            client.cpf_hash === cpfHash && String(client.usuario_id) === String(userId)
        );

        return existingClient || null;

    }

    static async delete(hash) {

        const registroAtual = await this.findByCpfHash(hash);

        if (!registroAtual) {
            throw new Error('Não foi possível excluir: cliente não encontrado ou você não tem permissão para removê-lo.');
        }

        const resultado = await QueryBuilder.delete('clientes', `id = ${Number(registroAtual.id)}`);

        if (!resultado || resultado === 0) {
            throw new Error('Não foi possível excluir o cliente: nenhum registro foi removido.');
        }

        return resultado;
    }

    static async update(oldHash, clientData) {

        const cpfLimpo = clientData.cpf.replace(/\D/g, '');
        const novoCpfHash = await EncryptionService.hash(cpfLimpo);
        
        const registroAtual = await this.findByCpfHash(oldHash);

        if (!registroAtual) {
            throw new Error('Não foi possível atualizar: cliente não encontrado ou você não tem permissão para alterá-lo.');
        }

        const encryptedData = {
            nome_completo: await EncryptionService.encrypt(clientData.nome_completo),
            cpf: await EncryptionService.encrypt(cpfLimpo),
            cpf_hash: novoCpfHash,
            data_nascimento: await EncryptionService.encrypt(clientData.data_nascimento),
            telefone: await EncryptionService.encrypt(clientData.telefone),
            celular: await EncryptionService.encrypt(clientData.celular)
        };

        const resultado = await QueryBuilder.update(
            this.tableName,
            encryptedData,
            `id = ${Number(registroAtual.id)}`
        );

        if (!resultado || resultado === 0) {
            throw new Error('Não foi possível atualizar o cliente: nenhum registro foi alterado.');
        }

        return resultado;
    }
    
}