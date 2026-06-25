import { AuthService } from '../services/AuthService.js';
import { UIModal } from '../utils/UIModal.js';
import { SecureStorage } from "../core/security/SecureStorage.js";
import { QueryBuilder } from '../core/database/QueryBuilder.js';

export class AuthController {

    static init() {
        
        const loginForm = document.getElementById('form-login');
        const registerForm = document.getElementById('form-register');
        const logoutBtn = document.getElementById('btn-logout');

        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

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

            console.error("Erro capturado:", error);
            this.#showFeedback(event.target, error.message, 'danger');
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
                alert("As senhas não coincidem.");
                return;
            }

            const response = await AuthService.register(rawData);

            alert("SUCESSO: " + response.message);

        } catch (error) {
            console.error("🔴 ERRO CAPTURADO:", error);
            UIModal.showAlert("Atenção", error.message, "warning");
        }
    }

    static handleLogout(event) {
        if (event) event.preventDefault();

        if (confirm("Tem certeza que deseja sair da sessão de forma segura?")) {
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


    static #showFeedback(formElement, message, type = 'danger') {

        const oldAlert = formElement.querySelector('.alert');
        if (oldAlert) oldAlert.remove();

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} mt-3 mb-0`;
        alertDiv.role = 'alert';
        alertDiv.textContent = message;

        formElement.appendChild(alertDiv);

        setTimeout(() => alertDiv.remove(), 5000);
    }
}