import { DataSyncService } from '../services/DataSyncService.js';
import { AuthService } from '../services/AuthService.js';

export class SettingsController {
    
    static init() {
        const btnExport = document.getElementById('btn-export-db');
        const formImport = document.getElementById('form-import-db');

        if (btnExport) {
            btnExport.addEventListener('click', this.handleExport.bind(this));
        }

        if (formImport) {
            formImport.addEventListener('submit', this.handleImport.bind(this));
        }
    }

    /**
     * Aciona o download do JSON com os dados do AlaSQL.
     */
    static async handleExport(event) {
        event.preventDefault();
        
        const btn = event.target;
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '⚙️ Gerando Backup...';
            
            await DataSyncService.exportDatabase();
            
            // Sucesso
            alert("Backup exportado com sucesso! Verifique sua pasta de downloads.");
            
        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /**
     * Lê o arquivo JSON selecionado e sobrescreve o banco local.
     */
    static async handleImport(event) {
        event.preventDefault();

        const fileInput = document.getElementById('input-file-db');
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, selecione um arquivo .json para importar.");
            return;
        }

        // ⚠️ Barreira de Segurança / Confirmação Crítica
        const warning = "ATENÇÃO: Importar um novo banco de dados apagará todos os clientes e endereços atuais. \n\nVocê será desconectado e precisará usar as credenciais da base importada. \n\nDeseja continuar?";
        
        if (!confirm(warning)) {
            fileInput.value = ''; // Limpa o input
            return;
        }

        const btnSubmit = event.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Restaurando...';

            const response = await DataSyncService.importDatabase(file);
            
            alert(response.message); // Exibe mensagem de sucesso
            
            // Destrói a chave AES antiga e limpa a sessão nativamente
            AuthService.logout();

        } catch (error) {
            alert(error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
            fileInput.value = '';
        }
    }
}