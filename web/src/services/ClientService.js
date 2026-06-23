import { Cliente } from '../domain/Cliente.js';
import { SecureClientRepository } from '../repositories/SecureClientRepository.js';

export class ClientService {
    
    /**
     * Orquestra a criação de um novo cliente aplicando validações e regras de negócio.
     * @param {Object} rawData - Dados brutos do formulário HTML
     */
    static async createClient(rawData) {
        
        const clientEntity = new Client(rawData);
        const cleanData = clientEntity.getDadosSanitizados();

        const existingClient = await SecureClientRepository.findByCpf(cleanData.cpf);
        if (existingClient) {
            throw new Error('Não é possível concluir o cadastro. O CPF informado já existe no sistema.');
        }

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