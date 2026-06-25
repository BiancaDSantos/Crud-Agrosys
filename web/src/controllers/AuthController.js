import { AuthService } from '../services/AuthService.js';
import { UIModal } from '../utils/UIModal.js';
import { SecureStorage } from "../core/security/SecureStorage.js";
import { QueryBuilder } from '../core/database/QueryBuilder.js';

export class AuthController {

    static init() {

        const loginForm = document.getElementById('form-login');
        const registerForm = document.getElementById('form-register');
        const logoutBtn = document.getElementById('btn-logout');

        if (loginForm) loginForm.addEventListener('submit', this.handleLogin.bind(this));
        if (registerForm) registerForm.addEventListener('submit', this.handleRegister.bind(this));
        if (logoutBtn) logoutBtn.addEventListener('click', this.handleLogout.bind(this));

    }

    static async handleLogin(event) {

        event.preventDefault();
        
        let userData = null; 

        const btnSubmit = event.target.querySelector('button[type="submit"]');
        const originalText = this.#setLoadingState(btnSubmit, true);

        const rawData = {
            username: document.getElementById('login-username').value.trim(),
            password: document.getElementById('login-password').value
        };

        try {

            userData = await AuthService.login(rawData);
            if (!userData) throw new Error('Credenciais inválidas.');

            const userRecord = await QueryBuilder.execute(`SELECT id FROM usuarios WHERE username = '${userData.username}'`);
            
            if (userRecord && userRecord.length > 0) {
                const userToSave = { id: userRecord[0].id, username: userData.username };
                SecureStorage.setItem('currentUser', userToSave);
                window.location.href = 'clientes.html';
            } else {
                throw new Error('Usuário não encontrado na base.');
            }

        } catch (error) {
            UIModal.showAlert("Falha no Login", error.message, "danger");  
        } finally {
            this.#setLoadingState(btnSubmit, false, originalText);
        }
    }

    static async handleRegister(event) {

        event.preventDefault();

        try {
            const rawData = {
                username: document.getElementById('register-username').value.trim(),
                password: document.getElementById('register-password').value
            };

            const confirmPassword = document.getElementById('register-confirm-password').value;
            if (rawData.password !== confirmPassword) {
                UIModal.showAlert("Atenção", "As senhas não coincidem.", "warning");
                return;
            }

            const response = await AuthService.register(rawData);

            UIModal.showAlert("Sucesso", response.message, "success");

        } catch (error) {
            UIModal.showAlert("Atenção", error.message, "warning");
        }
    }

    static async handleLogout(event) {
        if (event) event.preventDefault();

        const isConfirmed = await UIModal.showConfirm(
            "Encerrar Sessão", 
            "Tem certeza que deseja sair da sessão de forma segura?",
            "Sim, Sair",
            "danger"
        );

        if (isConfirmed) {
            AuthService.logout();
        }
    }


    static #setLoadingState(button, isLoading, originalText = '') {
        if (!button) return '';

        if (isLoading) {
            const currentText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
            return currentText;
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

}