import { DataSyncService } from '../services/DataSyncService.js';
import { SecureStorage } from '../core/security/SecureStorage.js';
import { AuthService } from '../services/AuthService.js';
import { UIModal } from '../utils/UIModal.js';

export class SettingsController {
    
    static init() {

        const btnExport = document.getElementById('btn-export-db');
        const formImport = document.getElementById('form-import-db');

        if (btnExport) btnExport.addEventListener('click', this.handleExport.bind(this));
        if (formImport) formImport.addEventListener('submit', this.handleImport.bind(this));

    }

    static async handleExport() {
        try {
            
            const usuarioLogado = SecureStorage.getItem('currentUser'); 
            
            const usuarioId = usuarioLogado?.id || usuarioLogado?.username || usuarioLogado;

           if (!usuarioId) {
                UIModal.showAlert('Atenção', 'Usuário não identificado na sessão.', 'warning');
                return;
            }
            
            await DataSyncService.exportDatabase(usuarioId);

            UIModal.showAlert('Atenção', 'Exportação realizada com sucesso!', 'success');
            
        } catch (error) {
            UIModal.showAlert('Erro', `Falha na exportação: ${error.message}`, 'danger');
        }
    }

    static async handleImport(event) {

        event.preventDefault();

        const fileInput = document.getElementById('input-file-db');
        const file = fileInput.files[0];

        if (!file) {
            UIModal.showAlert('Atenção', 'Por favor, selecione um arquivo .json para importar.', 'warning');
            return;
        }

        const warning = "ATENÇÃO: Importar um novo banco de dados apagará todos os clientes e endereços atuais. <br><br>Você será desconectado e precisará usar as credenciais da base importada. <br><br>Deseja continuar?";

        const isConfirmed = await UIModal.showConfirm('Restauração de Banco', warning, 'Sim, Importar', 'danger');
        
        if (!isConfirmed) {
            fileInput.value = ''; 
            return;
        }

        const btnSubmit = event.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;

        try {

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Restaurando...';

            const response = await DataSyncService.importDatabase(file);
            
            UIModal.showAlert('Sucesso', response.message, 'success');
            
            setTimeout(() => {
                AuthService.logout();
            }, 2000);

        } catch (error) {
            UIModal.showAlert('Erro', error.message, 'danger');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
            fileInput.value = '';
        }
    }
}