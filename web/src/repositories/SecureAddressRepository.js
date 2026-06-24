
import { QueryBuilder } from '../core/database/QueryBuilder.js';
import { EncryptionService } from '../core/security/EncryptionService.js';

export class SecureAddressRepository {
    static tableName = 'enderecos';

    /**
     * Criptografa as informações de localização antes de persistir.
     * *@param {Object} addressData
     * @param {number} addressData.cliente_id - Identificador único do cliente.
     * @param {string} addressData.cep - CEP (apenas números).
     * @param {string} addressData.rua - Nome do logradouro.
     * @param {string} addressData.bairro - Nome do bairro.
     * @param {string} addressData.cidade - Nome da cidade.
     * @param {string} addressData.estado - Sigla do estado (ex: SC).
     * @param {string} addressData.pais - Nome do país.
     * @param {boolean} addressData.is_principal - Flag indicando se é o endereço principal.           
     */
    static async create(addressData) {

        const [
             cepEncriptografado,
            ruaEcriptografado,
            numeroEncriptografado,
            complementoEncriptografado,
            bairroEcriptografado,
            cidadeEcriptografado,
            estadoEcriptografado,
            paisEcriptografado
        ] = await Promise.all([
            EncryptionService.encrypt(addressData.cep),
            EncryptionService.encrypt(addressData.rua),
            EncryptionService.encrypt(addressData.numero),
            EncryptionService.encrypt(addressData.complemento || ''),
            EncryptionService.encrypt(addressData.bairro),
            EncryptionService.encrypt(addressData.cidade),
            EncryptionService.encrypt(addressData.estado),
            EncryptionService.encrypt(addressData.pais),
        ]);

        const encryptedAddress = {
            cliente_id: addressData.cliente_id,
            cep: cepEncriptografado,
            rua: ruaEcriptografado,
            numero: numeroEncriptografado,
            complemento: complementoEncriptografado,
            bairro: bairroEcriptografado,
            cidade: cidadeEcriptografado,
            estado: estadoEcriptografado,
            pais: paisEcriptografado,
            is_principal: addressData.is_principal
        };

        return QueryBuilder.insert(this.tableName, encryptedAddress);
    }

    /**
     * Busca os endereços vinculados a um cliente no banco de dados e descriptografa.
     */
    static async findByClienteId(clienteId) {

        const sanitizedId = this.#validateClienteId(clienteId);
        const enderecos = await QueryBuilder.select(this.tableName, 'cliente_id = ?', [sanitizedId]);

        return Promise.all(enderecos.map(async (end) => {

            const [
                cepDescriptografado,
                ruaDescriptografado,
                numeroDescriptografado,
                complementoDescriptografado,
                bairroDescriptografado,
                cidadeDescriptografado,
                estadoDescriptografado,
                paisDescriptografado
            ] = await Promise.all([
                EncryptionService.decrypt(end.cep),
                EncryptionService.decrypt(end.rua),
                EncryptionService.decrypt(end.numero),
                EncryptionService.decrypt(end.complemento),
                EncryptionService.decrypt(end.bairro),
                EncryptionService.decrypt(end.cidade),
                EncryptionService.decrypt(end.estado),
                EncryptionService.decrypt(end.pais)
            ]);

            return {
                id: end.id,
                cliente_id: end.cliente_id,
                cep: cepDescriptografado,
                rua: ruaDescriptografado,
                numero: numeroDescriptografado,
                complemento: complementoDescriptografado,
                bairro: bairroDescriptografado,
                cidade: cidadeDescriptografado,
                estado: estadoDescriptografado,
                pais: paisDescriptografado,
                is_principal: end.is_principal
            };

        }));
    }

  static async update(id, addressData) {
        const sanitizedId = this.#validateId(id);

        const encryptedAddress = {
            cep: await EncryptionService.encrypt(addressData.cep),
            rua: await EncryptionService.encrypt(addressData.rua),
            numero: await EncryptionService.encrypt(addressData.numero),
            complemento: await EncryptionService.encrypt(addressData.complemento || ''),
            bairro: await EncryptionService.encrypt(addressData.bairro),
            cidade: await EncryptionService.encrypt(addressData.cidade),
            estado: await EncryptionService.encrypt(addressData.estado),
            pais: await EncryptionService.encrypt(addressData.pais),
            is_principal: addressData.is_principal
        };

        return QueryBuilder.update(
            this.tableName,
            encryptedAddress,
            `id = ${sanitizedId}`
        );
    }

    static async delete(id) {
        const sanitizedId = this.#validateId(id);
        return QueryBuilder.delete(this.tableName, `id = ${sanitizedId}`);
    }

    static async removePrincipalFlag(clienteId) {

        const sanitizedId = this.#validateClienteId(clienteId);

        return QueryBuilder.update(
            this.tableName,
            { is_principal: false },
            `cliente_id = ${sanitizedId}`
        );

    }

    static async countByClienteId(clienteId) {

        const sanitizedId = this.#validateClienteId(clienteId);

        const sql = `SELECT COUNT(*) AS quantidade FROM ${this.tableName} WHERE cliente_id = ?`;
        const result = await QueryBuilder.execute(sql, [sanitizedId]);

        return result && result.length > 0 ? parseInt(result[0].quantidade, 10) : 0;

    }

    static #validateClienteId(clienteId) {

        if (!clienteId) {
            throw new Error('O ID do cliente é obrigatório.');
        }

        const sanitizedId = parseInt(clienteId, 10);
        if (isNaN(sanitizedId) || sanitizedId <= 0) {
            throw new Error('O ID do cliente deve ser um número inteiro positivo.');
        }

        return sanitizedId;

    }

    static #validateId(id) {

        if (!id) {
            throw new Error('O ID do endereço é obrigatório.');
        }

        const sanitizedId = parseInt(id, 10);
        if (isNaN(sanitizedId) || sanitizedId <= 0) {
            throw new Error('O ID do endereço deve ser um número inteiro positivo.');
        }

        return sanitizedId;

    }
}