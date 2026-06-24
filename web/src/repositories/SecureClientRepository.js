import { EncryptionService } from "../core/security/EncryptionService.js";
import { QueryBuilder } from "../core/database/QueryBuilder.js";

export class SecureClientRepository {
    static tableName = 'clientes';

    /**
     * Salva um cliente protegendo todos os seus dados.
     */
    static async create(clientData) {

        const cpfLimpo = clientData.cpf.replace(/\D/g, '');
        const cpfHash = await EncryptionService.hash(cpfLimpo);

        const encryptedData = {
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

        const rawData = await QueryBuilder.select(this.tableName);
        console.log("📦 [REPO] Dados brutos do banco:", rawData);

        const decryptedClients = await Promise.all(rawData.map(async (item) => {

            const nome = await EncryptionService.decrypt(item.nome_completo);
            const cpf = await EncryptionService.decrypt(item.cpf);
            const tel = await EncryptionService.decrypt(item.celular);

            console.log(`🔑 [REPO] Descriptografado ID ${item.id}:`, { nome, cpf, tel });

            return {
                id: item.id,
                nome_completo: nome,
                cpf: cpf,
                celular: tel
            };
        }));

        return decryptedClients;
    }

    /**
     * Verifica se um CPF já existe no banco comparando o Hash.
     */
    static async findByCpf(cpf) {
        const cpfHash = await EncryptionService.hash(cpf);
        const result = await QueryBuilder.select(this.tableName, 'cpf_hash = ?', [cpfHash]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Verifica se já existe um cliente com o mesmo hash de CPF.
     */
    static async findByCpfHash(cpfHash) {
        const results = await QueryBuilder.select(this.tableName, 'cpf_hash = ?', [cpfHash]);
        return results.length > 0 ? results[0] : null;
    }



    static async findById(id) {
        const result = await QueryBuilder.select(this.tableName, 'id = ?', [id]);
        if (result.length === 0) return null;

        const cliente = result[0];
        // Retorna o cliente descriptografado
        return {
            id: cliente.id,
            nome_completo: await EncryptionService.decrypt(cliente.nome_completo),
            cpf: await EncryptionService.decrypt(cliente.cpf)
        };
    }
}