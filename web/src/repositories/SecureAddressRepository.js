
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
            bairroEcriptografado,
            cidadeEcriptografado,
            estadoEcriptografado,
            paisEcriptografado

        ] = await Promise.all([

            EncryptionService.encrypt(addressData.cep),
            EncryptionService.encrypt(addressData.rua),
            EncryptionService.encrypt(addressData.bairro),
            EncryptionService.encrypt(addressData.cidade),
            EncryptionService.encrypt(addressData.estado),
            EncryptionService.encrypt(addressData.pais),

        ]);

        return QueryBuilder.insert(this.tableName, encryptedAddress);
    }

    /**
     * Busca os endereços vinculados a um cliente no banco de dados e descriptografa 
     * as informações sensíveis de localização para exibição na interface.
     * * @param {number} clienteId - Identificador único do cliente.
     * @returns {Promise<Array<{
     * id: number,
     * cliente_id: number,
     * cep: string,
     * rua: string,
     * bairro: string,
     * cidade: string,
     * estado: string,
     * pais: string,
     * is_principal: boolean
     * }>>} Lista de objetos contendo os endereços com os dados legíveis (texto).
     */
    static async findByClienteId(clienteId) {

        const enderecos = await QueryBuilder.select(this.tableName, 'cliente_id = ?', [clienteId]);

        return Promise.all(enderecos.map(async (end) => {

            const [
                
                cepDescriptografado,
                ruaDescriptografado,
                bairroDescriptografado,
                cidadeDescriptografado,
                estadoDescriptografado,
                paisDescriptografado

            ] = await Promise.all([
                
                EncryptionService.decrypt(end.cep),
                EncryptionService.decrypt(end.rua),
                EncryptionService.decrypt(end.bairro),
                EncryptionService.decrypt(end.cidade),
                EncryptionService.decrypt(end.estado),
                EncryptionService.decrypt(end.pais)

            ]);

            return {

                cep: cepDec,
                rua: ruaDec,
                bairro: bairroDec,
                cidade: cidadeDec,
                estado: estadoDec,
                pais: paisDec,
                is_principal: end.is_principal

            };

        }));
    }

    /**
     * Remove a marcação de 'principal' de todos os endereços vinculados a um cliente.
     * @param {number} clienteId
     * @returns {Promise<null>}
     */
    static async removePrincipalFlag(clienteId) {

        const sanitizedId = this.#validateClienteId(clienteId);

        return QueryBuilder.update(

            this.tableName,
            { is_principal: false },
            'cliente_id = ?',
            [sanitizedId]

        );

    }

    /**
     * Conta a quantidade total de endereços cadastrados para um cliente específico.
     * @param {number} clienteId
     * @returns {Promise<number>}
     */
    static async countByClienteId(clienteId) {

        const sanitizedId = this.#validateClienteId(clienteId);

        const sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE cliente_id = ?`;
        const result = await QueryBuilder.execute(sql, [sanitizedId]);

        return result && result.length > 0 ? parseInt(result[0].total, 10) : 0;

    }


    /**
     * Valida e sanitiza o ID do cliente.
     * @param {number} clienteId 
     * @returns {number}
     */
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
}