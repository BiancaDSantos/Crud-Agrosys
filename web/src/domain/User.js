export class User {
    constructor({ username, password }) {
        this.username = username;
        this.password = password;

        this.validate();
    }

    validate() {

        if (!this.username || this.username.trim().length < 3) {
            throw new Error("O nome de usuário deve ter pelo menos 3 caracteres.");
        }
        
        // TO DO: exigiriamos complexidade (letras, números, símbolos)
        if (!this.password || this.password.length < 6) {
            throw new Error("A senha deve conter no mínimo 6 caracteres para sua segurança.");
        }
        
    }

    toJSON() {
        return {
            username: this.username.trim().toLowerCase(),
            password: this.password
        };
    }
}