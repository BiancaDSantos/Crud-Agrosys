import { ClientService } from '../services/ClientService.js';

export class ClienteController {
    
    /**
     * Inicializa os ouvintes de eventos da tela de Clientes.
     * Deve ser chamado assim que o DOM carregar.
     */
    static init() {
        const form = document.getElementById('form-cliente');
        if (form) {
            form.addEventListener('submit', this.salvarCliente.bind(this));
        }
        
        this.carregarTabela();

    }

    /**
     * Captura os dados do formulário e delega a criação ao Service.
     */
    static async salvarCliente(event) {

        event.preventDefault();
        
        const clienteData = {
            nome_completo: document.getElementById('input-nome').value.trim(),
            cpf: document.getElementById('input-cpf').value,
            data_nascimento: document.getElementById('input-nascimento').value,
            telefone: document.getElementById('input-telefone').value,
            celular: document.getElementById('input-celular').value
        };

        try {
            
            await ClientService.criarCliente(clienteData);
            
            
            alert('Cliente salvo com sucesso!');
            document.getElementById('form-cliente').reset();
            this.carregarTabela();
            
        } catch (error) {
            
            alert(`Erro: ${error.message}`);

        }
    }

    
    static async carregarTabela() {
        const tbody = document.getElementById('tabela-clientes-body');
        if (!tbody) return;

        try {

            const clientes = await ClientService.listarClientes();

            tbody.innerHTML = '';

            if (clientes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum cliente cadastrado.</td></tr>';
                return;
            }

            clientes.forEach(cliente => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${cliente.nome_completo}</td>
                    <td>${this.formatarCpfVisual(cliente.cpf)}</td>
                    <td>${cliente.celular}</td>
                    <td>
                        <a href="addresses.html?clienteId=${cliente.id}" class="btn btn-sm btn-outline-primary">
                            Gerenciar Endereços
                        </a>
                    </td>
                `;

                tbody.appendChild(tr);
            });

        } catch (error) {

            console.error("Erro ao montar tabela de clientes:", error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar dados.</td></tr>';

        }
    }

    
    static formatarCpfVisual(cpf) {
        const num = cpf.replace(/\D/g, '');
        return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

}