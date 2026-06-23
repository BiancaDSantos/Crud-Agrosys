export class BuscaCep {

    /**
     * Busca os dados de um CEP na API pública.
     * @param {string} cep
     * @returns {Promise<Object | null>}
     */
    static async buscarCep(cep) {
        
        const cepValidado = this.validarCep(cep);

        
        if (!cepValidado.valido) {
            throw new Error(cepValidado.mensagem);
        }

        try {
            
            const response = await fetch(`https://viacep.com.br/ws/${cepValidado.cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                return null; 
            }

            return {
                rua: data.logradouro,
                bairro: data.bairro,
                cidade: data.localidade,
                estado: data.uf
            };
        } catch (error) {

            alert("Erro ao buscar o CEP: ", error);
            
            throw new Error("Falha na comunicação com o serviço de CEP.");

        }
    }

    /**
     * Valida e sanitiza o formato do CEP.
     * @param {string} cep
     * @returns {Object}
     */
    static validarCep(cep) {
        const cepSanitizado = cep.replace(/\D/g, '');

        if (cepSanitizado.length !== 8) {
            return {
                valido: false,
                mensagem: 'CEP deve ter 8 dígitos'
            };
        }

        if (/^0{8}$/.test(cepSanitizado)) {
            return {
                valido: false,
                mensagem: 'CEP inválido'
            };
        }

        return {
            valido: true,
            cep: cepSanitizado,
            cepFormatado: `${cepSanitizado.substring(0, 5)}-${cepSanitizado.substring(5)}`
        };
    }
}