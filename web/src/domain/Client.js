export class Client {

    constructor({ nome_completo, cpf, data_nascimento, telefone, celular }) {
        this.nome_completo = nome_completo;
        this.cpf = cpf;
        this.data_nascimento = data_nascimento;
        this.telefone = telefone;
        this.celular = celular;

        this.validate();
    }

    validate() {
        if (!this.nome_completo || this.nome_completo.trim().split(' ').length < 2) {
            throw new Error("Por favor, informe o nome completo (nome e sobrenome).");
        }

        if (!this.data_nascimento) {
            throw new Error("A data de nascimento é obrigatória.");
        }

        if (!this.telefone && !this.celular) {
            throw new Error("É obrigatório informar pelo menos um telefone ou celular.");
        }

        if (!this.isCpfValido(this.cpf)) {
            throw new Error("O CPF informado é matematicamente inválido.");
        }
    }

    /**
     * Algoritmo formal de validação de CPF
     */
    isCpfValido(cpfRaw) {
        if (!cpfRaw) return false;
        
        const cpf = cpfRaw.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        let resto;

        
        for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
       
        for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    
    getDadosSanitizados() {
        return {
            nome_completo: this.nome_completo.trim(),
            cpf: this.cpf.replace(/\D/g, ''),
            data_nascimento: this.data_nascimento,
            telefone: this.telefone.replace(/\D/g, ''),
            celular: this.celular.replace(/\D/g, '')
        };
    }
}