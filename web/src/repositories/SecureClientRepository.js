import { EncryptionService } from "../core/security/EncryptionService.js";
import { QueryBuilder } from "../core/database/QueryBuilder.js";

export class SecureClientRepository {
    static tableName = 'clientes';

    /**
     * Salva um cliente protegendo todos os seus dados.
     */
    static async create(clientData) {
        
        // 1. Gera o Hash SHA-256 do CPF (Usado pelo DB para barrar duplicidade)
        const cpfHash = await EncryptionService.hash(clientData.cpf);

        // 2. Criptografa os dados sensíveis usando AES-256-GCM
        const encryptedData = {
            nome_completo: await EncryptionService.encrypt(clientData.nome_completo),
            cpf: await EncryptionService.encrypt(clientData.cpf), // Salva criptografado para exibir na tela depois
            cpf_hash: cpfHash, // Usado apenas para busca e regra UNIQUE
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
        const clientesEncrypted = await QueryBuilder.select(this.tableName);
        
        // Descriptografa todos os registros de forma assíncrona
        const clientesDecrypted = await Promise.all(clientesEncrypted.map(async cliente => {
            return {
                id: cliente.id,
                nome_completo: await EncryptionService.decrypt(cliente.nome_completo),
                cpf: await EncryptionService.decrypt(cliente.cpf),
                data_nascimento: await EncryptionService.decrypt(cliente.data_nascimento),
                telefone: await EncryptionService.decrypt(cliente.telefone),
                celular: await EncryptionService.decrypt(cliente.celular)
            };
        }));

        return clientesDecrypted;
    }

    /**
     * Verifica se um CPF já existe no banco comparando o Hash.
     */
    static async findByCpf(cpf) {
        const cpfHash = await EncryptionService.hash(cpf);
        const result = await QueryBuilder.select(this.tableName, 'cpf_hash = ?', [cpfHash]);
        return result.length > 0 ? result[0] : null;
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