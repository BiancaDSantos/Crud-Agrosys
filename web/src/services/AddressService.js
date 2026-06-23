import { Address } from '../domain/Address.js';
import { SecureAddressRepository } from '../repositories/SecureAddressRepository.js';

export class AddressService {
    
    /**
     * Orquestra a criação do endereço, garantindo a regra de exclusividade do endereço principal.
     * @param {Object} rawData - Dados do formulário
     */
    static async createEndereco(rawData) {
       
        const addressEntity = new Address(rawData);
        const cleanData = addressEntity.getDadosSanitizados();

        const totalEnderecos = await SecureAddressRepository.countByClienteId(cleanData.cliente_id);

        if (totalEnderecos === 0) {

            cleanData.is_principal = true;

        } else if (cleanData.is_principal) {

            await SecureAddressRepository.removePrincipalFlag(cleanData.cliente_id);

        }

        await SecureAddressRepository.create(cleanData);
        
        SecureAddressRepository.clearCacheForClient(cleanData.cliente_id);

        return { success: true };
    }

    static async listarEnderecosPorCliente(clienteId) {
        return SecureAddressRepository.findByClienteId(clienteId);
    }
}