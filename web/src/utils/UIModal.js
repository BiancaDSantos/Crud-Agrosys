export class UIModal {
    static modalInstance = null;


    static getModal() {
        if (!this.modalInstance) {
            const modalElement = document.getElementById('dynamicModal');
            this.modalInstance = new bootstrap.Modal(modalElement);
        }
        return this.modalInstance;
    }

    static showAlert(title, message, type = 'primary') {
        document.getElementById('dynamicModalTitle').innerHTML = title;
        document.getElementById('dynamicModalTitle').className = `modal-title fw-bold text-${type}`;
        document.getElementById('dynamicModalBody').innerHTML = message;
        
        const footer = document.getElementById('dynamicModalFooter');
        footer.innerHTML = `
            <button type="button" class="btn btn-${type} rounded-pill px-4" data-bs-dismiss="modal">Entendi</button>
        `;

        this.getModal().show();
    }

    static async showConfirm(title, message, confirmText = 'Confirmar', btnType = 'danger') {
        return new Promise((resolve) => {
            
            document.getElementById('dynamicModalTitle').innerHTML = title;
            document.getElementById('dynamicModalTitle').className = `modal-title fw-bold text-${btnType}`;
            document.getElementById('dynamicModalBody').innerHTML = message;
            
            const footer = document.getElementById('dynamicModalFooter');
            footer.innerHTML = `
                <button type="button" class="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal" id="btnModalCancel">Cancelar</button>
                <button type="button" class="btn btn-${btnType} rounded-pill px-4" id="btnModalConfirm">${confirmText}</button>
            `;

            this.getModal().show();

            document.getElementById('btnModalConfirm').onclick = () => {
                this.getModal().hide();
                resolve(true);
            };

            document.getElementById('btnModalCancel').onclick = () => {
                resolve(false);
            };

            document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', function onHidden() {
                document.getElementById('dynamicModal').removeEventListener('hidden.bs.modal', onHidden);
                resolve(false); 
            });

        });
    }
}