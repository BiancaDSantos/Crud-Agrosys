import { AuthService } from '../services/AuthService.js';

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

    /**
     * Processa a tentativa de Cadastro.
     */
    // static async handleRegister(event) {
    //     event.preventDefault();

    //     console.log("👉 O botão de cadastro foi clicado e o JS ouviu!");

    //     const btnSubmit = event.target.querySelector('button[type="submit"]');
    //     const originalText = this.#setLoadingState(btnSubmit, true);

    //     const rawData = {
    //         username: document.getElementById('register-username').value.trim(),
    //         password: document.getElementById('register-password').value
    //     };

    //     // Validação de confirmação de senha apenas no Front-end (UX)
    //     const confirmPassword = document.getElementById('register-confirm-password').value;
    //     if (rawData.password !== confirmPassword) {
    //         this.#showFeedback(event.target, 'As senhas não coincidem.', 'warning');
    //         this.#setLoadingState(btnSubmit, false, originalText);
    //         return;
    //     }

    //     try {
    //         const response = await AuthService.register(rawData);

    //         // Feedback de sucesso visual
    //         this.#showFeedback(event.target, response.message, 'success');
    //         event.target.reset(); // Limpa o formulário

    //         // Opcional: Alterna visualmente para a aba de login (se usar Bootstrap Tabs)
    //         const loginTab = document.getElementById('login-tab');
    //         if (loginTab) loginTab.click();

    //     } catch (error) {
    //         this.#showFeedback(event.target, error.message, 'danger');
    //     } finally {
    //         this.#setLoadingState(btnSubmit, false, originalText);
    //     }
    // }

    static async handleRegister(event) {
        event.preventDefault();
        console.log("🟢 1. Entrou no handleRegister");

        try {
            const rawData = {
                username: document.getElementById('register-username').value.trim(),
                password: document.getElementById('register-password').value
            };
            console.log("🟢 2. Dados capturados:", rawData);

            const confirmPassword = document.getElementById('register-confirm-password').value;
            if (rawData.password !== confirmPassword) {
                console.log("🟡 3. As senhas não batem");
                alert("As senhas não coincidem.");
                return;
            }

            console.log("🟢 4. Chamando AuthService.register...");
            const response = await AuthService.register(rawData);
            
            console.log("🟢 5. Serviço finalizou com sucesso!");
            alert("SUCESSO: " + response.message);

        } catch (error) {
            console.error("🔴 ERRO CAPTURADO:", error);
            alert("ERRO: " + error.message);
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