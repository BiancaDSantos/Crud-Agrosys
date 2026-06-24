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

        this.validarIdade();

        if (!this.telefone && !this.celular) {
            throw new Error("É obrigatório informar pelo menos um telefone ou celular.");
        }

        if (!this.isCpfValido(this.cpf)) {
            throw new Error("O CPF informado é matematicamente inválido.");
        }
    }

    validarIdade() {
        const dataNascimento = new Date(`${this.data_nascimento}T00:00:00`);

        if (isNaN(dataNascimento.getTime())) {
            throw new Error("A data de nascimento informada é inválida.");
        }

        const hoje = new Date();

        if (dataNascimento > hoje) {
            throw new Error("A data de nascimento não pode ser uma data futura.");
        }

        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const diaAtual = hoje.getDate();

        const mesNascimento = dataNascimento.getMonth();
        const diaNascimento = dataNascimento.getDate();

        const aindaNaoFezAniversarioEsteAno =
            mesAtual < mesNascimento ||
            (mesAtual === mesNascimento && diaAtual < diaNascimento);

        if (aindaNaoFezAniversarioEsteAno) {
            idade--;
        }

        if (idade < 18) {
            throw new Error("Não é permitido cadastrar clientes menores de 18 anos.");
        }

        if (idade > 100) {
            throw new Error("Não é permitido cadastrar clientes com mais de 100 anos.");
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