export class Address {
    
    constructor({ cliente_id, cep, rua, bairro, cidade, estado, pais, is_principal }) {
        this.cliente_id = parseInt(cliente_id, 10);
        this.cep = cep;
        this.rua = rua;
        this.bairro = bairro;
        this.cidade = cidade;
        this.estado = estado;
        this.pais = pais || 'Brasil';
        this.is_principal = Boolean(is_principal);

        this.validate();
    }

    validate() {
        if (isNaN(this.cliente_id) || this.cliente_id <= 0) {
            throw new Error("Identificador do cliente inválido ou não informado.");
        }

        const cepLimpo = this.cep ? this.cep.replace(/\D/g, '') : '';
        if (cepLimpo.length !== 8) {
            throw new Error("O CEP deve conter 8 dígitos válidos.");
        }

        const requiredFields = {
            'Rua': this.rua,
            'Bairro': this.bairro,
            'Cidade': this.cidade,
            'Estado': this.estado,
            'País': this.pais
        };

        for (const [fieldName, value] of Object.entries(requiredFields)) {
            if (!value || value.trim().length === 0) {
                throw new Error(`O campo obrigatório "${fieldName}" não pode estar vazio.`);
            }
        }
    }

    getDadosSanitizados() {
        return {
            cliente_id: this.cliente_id,
            cep: this.cep.replace(/\D/g, ''),
            rua: this.rua.trim(),
            bairro: this.bairro.trim(),
            cidade: this.cidade.trim(),
            estado: this.estado.trim(),
            pais: this.pais.trim(),
            is_principal: this.is_principal
        };
    }
}