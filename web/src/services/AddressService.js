import { Address } from '../domain/Address.js';
import { SecureAddressRepository } from '../repositories/SecureAddressRepository.js';

export class AddressService {
    
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

        return { success: true };
    }

    static async criarEndereco(rawData) {
        return this.createEndereco(rawData);
    }

    static async atualizarEndereco(id, rawData) {
        const addressEntity = new Address(rawData);
        const cleanData = addressEntity.getDadosSanitizados();

        if (cleanData.is_principal) {
            await SecureAddressRepository.removePrincipalFlag(cleanData.cliente_id);
        }

        await SecureAddressRepository.update(id, cleanData);

        return { success: true };
    }

    static async excluirEndereco(id) {
        if (!id) {
            throw new Error("Identificador do endereço não informado.");
        }

        await SecureAddressRepository.delete(id);

        return { success: true };
    }

    static async listarEnderecosPorCliente(clienteId) {
        return SecureAddressRepository.findByClienteId(clienteId);
    }
}