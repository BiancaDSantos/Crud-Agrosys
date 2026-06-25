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

        const enderecoAtual = await SecureAddressRepository.findById(id);

        if (cleanData.is_principal) {
            // Este endereço será o novo principal: remove a flag dos demais.
            await SecureAddressRepository.removePrincipalFlag(cleanData.cliente_id);
        } else if (enderecoAtual && enderecoAtual.is_principal) {
            // O usuário está desmarcando o que hoje é o principal.
            const todosEnderecos = await SecureAddressRepository.findByClienteId(cleanData.cliente_id);
            const existeOutro = todosEnderecos.some(end => String(end.id) !== String(id));

            if (!existeOutro) {
                // É o único endereço do cliente: não pode deixar de ser principal.
                cleanData.is_principal = true;
            }
            // Se existe outro endereço, a desmarcação é permitida, mas isso deixaria
            // o cliente sem endereço principal — por isso a UI deveria promover outro
            // endereço explicitamente em vez de simplesmente desmarcar este.
        }

        await SecureAddressRepository.update(id, cleanData);

        return { success: true };
    }

    static async excluirEndereco(id) {
        if (!id) {
            throw new Error("Identificador do endereço não informado.");
        }

        const enderecoExcluido = await SecureAddressRepository.findById(id);

        await SecureAddressRepository.delete(id);

        if (enderecoExcluido && enderecoExcluido.is_principal) {
            const restantes = await SecureAddressRepository.findByClienteId(enderecoExcluido.cliente_id);

            if (restantes.length > 0) {
                const proximoPrincipal = restantes[0];
                await SecureAddressRepository.update(proximoPrincipal.id, {
                    ...proximoPrincipal,
                    is_principal: true
                });
            }
        }

        return { success: true };
    }

    static async listarEnderecosPorCliente(clienteId) {
        return SecureAddressRepository.findByClienteId(clienteId);
    }
}