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
            throw new Error('Não é possível concluir o cadastro. O CPF informado já existe no seu banco de dados.');
        }

        const clientEntity = new Client(rawData);
        const cleanData = clientEntity.getDadosSanitizados();

        await SecureClientRepository.create(cleanData);
        
        return { success: true };
    }

    static async listarClientes() {
        return SecureClientRepository.findAll();
    }

    /**
     * Orquestra a exclusão de um cliente.
     * @param {number|string} id
     */
    static async excluirCliente(hash) {
        if (!hash) throw new Error("Identificador do cliente não fornecido para exclusão.");
        await SecureClientRepository.delete(hash);
        return { success: true };
    }
    
    static async atualizarCliente(oldHash, rawData) {
        
        const clientEntity = new Client(rawData);
        const cleanData = clientEntity.getDadosSanitizados();
        
        const novoCpfHash = await EncryptionService.hash(cleanData.cpf);

        if (novoCpfHash !== oldHash) {
            const existingClient = await SecureClientRepository.findByCpfHash(novoCpfHash);
            if (existingClient) {
                throw new Error('Não é possível salvar. O novo CPF informado já pertence a outro cliente.');
            }
        }

        await SecureClientRepository.update(oldHash, cleanData);
        return { success: true };
    }
}