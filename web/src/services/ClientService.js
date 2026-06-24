import { Client } from '../domain/Client.js';
import { SecureClientRepository } from '../repositories/SecureClientRepository.js';
import { EncryptionService } from '../core/security/EncryptionService.js';

export class ClientService {
    
    /**
     * Orquestra a criação de um novo cliente aplicando validações e regras de negócio.
     * @param {Object} rawData - Dados brutos do formulário HTML
     */
    static async createClient(rawData) {
        
        const cpfLimpo = rawData.cpf.replace(/\D/g, '');
        const cpfHash = await EncryptionService.hash(cpfLimpo);

        const existingClient = await SecureClientRepository.findByCpfHash(cpfHash);
        if (existingClient) {
            throw new Error('Não é possível concluir o cadastro. O CPF informado já existe no sistema.');
        }

        const clientEntity = new Client(rawData);
        const cleanData = clientEntity.getDadosSanitizados();

        await SecureClientRepository.create(cleanData);
        
        return { success: true };
    }

    /**
     * Retorna a lista de clientes com os dados já descriptografados pelo Repositório.
     */
    static async listarClientes() {
        return SecureClientRepository.findAll();
    }
}