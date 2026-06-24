import { AuthService } from '../services/AuthService.js';
import { UIModal } from '../utils/UIModal.js';

export class AuthController {

    /**
     * Inicializa os ouvintes de eventos da tela de Login/Cadastro.
     * Deve ser chamado no DOMContentLoaded do index.html.
     */
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

    /**
     * Processa a tentativa de Login.
     */
    static async handleLogin(event) {
        event.preventDefault();

        const btnSubmit = event.target.querySelector('button[type="submit"]');
        const originalText = this.#setLoadingState(btnSubmit, true);

        const rawData = {
            username: document.getElementById('login-username').value.trim(),
            password: document.getElementById('login-password').value
        };

        try {
            // Delega a regra de negócio e derivação de chave para o Service
            await AuthService.login(rawData);

            // Login de sucesso: Redireciona para o painel de clientes
            window.location.href = 'clientes.html';

        } catch (error) {
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

    // ==========================================
    // 🎨 MÉTODOS UTILITÁRIOS (UX & UI)
    // ==========================================

    /**
     * Desabilita o botão e mostra um spinner durante o processamento (ex: geração do Hash).
     */
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

    /**
     * Injeta um alerta do Bootstrap abaixo do formulário para dar feedback ao usuário.
     */
    static #showFeedback(formElement, message, type = 'danger') {
        // Remove alertas antigos
        const oldAlert = formElement.querySelector('.alert');
        if (oldAlert) oldAlert.remove();

        // Cria o novo alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} mt-3 mb-0`;
        alertDiv.role = 'alert';
        alertDiv.textContent = message;

        formElement.appendChild(alertDiv);

        // Remove automaticamente após 5 segundos
        setTimeout(() => alertDiv.remove(), 5000);
    }
}