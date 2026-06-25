import { ClientService } from '../services/ClientService.js';
import { UIModal } from '../utils/UIModal.js';

export class ClientController {

    static paginaAtual = 1;
    static itensPorPagina = 5;
    static clientesCache = [];
    static cpfsVisiveis = new Set();


    static init() {

        this.configurarLimitesDataNascimento();

        const form = document.getElementById('form-cliente');
        if (form) {
            form.addEventListener('submit', this.salvarCliente.bind(this));
        }

        this.carregarTabela();

        const tbody = document.getElementById('tabela-clientes-body');
        if (tbody) {
            tbody.addEventListener('click', async (e) => {

                const btnExcluir = e.target.closest('.btn-excluir');
                if (btnExcluir) {
                    const hash = btnExcluir.getAttribute('data-hash');
                    await this.excluirCliente(hash);
                    return;
                }

                const btnEditar = e.target.closest('.btn-editar');
                if (btnEditar) {
                    const hash = btnEditar.getAttribute('data-hash');
                    await this.carregarClienteParaEdicao(hash);
                    return;
                }

                const btnCpf = e.target.closest('.btn-toggle-cpf');
                if (btnCpf) {
                    const hash = btnCpf.getAttribute('data-hash');

                    if (this.cpfsVisiveis.has(hash)) {
                        this.cpfsVisiveis.delete(hash);
                    } else {
                        this.cpfsVisiveis.add(hash);
                    }

                    this.renderizarTabela();
                }
            });
        }

        const pagination = document.getElementById('clientes-pagination');
        if (pagination) {
            pagination.addEventListener('click', (e) => {
                const btnPage = e.target.closest('[data-page]');
                if (!btnPage) return;

                const novaPagina = parseInt(btnPage.getAttribute('data-page'), 10);
                if (isNaN(novaPagina)) return;

                this.paginaAtual = novaPagina;
                this.renderizarTabela();
            });
        }
    }

    static async salvarCliente(event) {

        event.preventDefault();

        const clienteData = {

            nome_completo: document.getElementById('input-nome').value.trim(),
            cpf: document.getElementById('input-cpf').value,
            data_nascimento: document.getElementById('input-nascimento').value,
            telefone: document.getElementById('input-telefone').value,
            celular: document.getElementById('input-celular').value

        };

        const form = document.getElementById('form-cliente');
        const editHash = form.getAttribute('data-edit-hash');

        try {
            if (editHash) {

                await ClientService.atualizarCliente(editHash, clienteData);
                UIModal.showAlert("Sucesso!", "Dados do cliente atualizados com sucesso!", "success");

                ClientController.cancelarEdicao();

            } else {

                await ClientService.createClient(clienteData);
                UIModal.showAlert("Sucesso!", "Novo cliente salvo com sucesso!", "success");
                form.reset();

            }

            await new Promise(resolve => setTimeout(resolve, 300));

            await this.carregarTabela();

        } catch (error) {
            console.error("Erro capturado no catch:", error);
            UIModal.showAlert("Atenção", error.message, "warning");
        }
    }

    static cancelarEdicao() {

        const form = document.getElementById('form-cliente');
        form.reset();
        form.removeAttribute('data-edit-hash');

        const formTitle = document.getElementById('form-title');
        if (formTitle) {
            formTitle.innerHTML = '<i class="bi bi-person-plus text-primary me-2"></i> Novo Cliente';
        }

        const btnSubmit = document.querySelector('#form-cliente button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.innerText = "Cadastrar Cliente";
            btnSubmit.classList.replace('btn-warning', 'btn-primary');
        }

    }

    static async carregarClienteParaEdicao(hash) {
        try {

            const clientes = await ClientService.listarClientes();
            const cliente = clientes.find(c => c.cpf_hash === hash);

            if (!cliente) {
                UIModal.showAlert("Erro", "Cliente não encontrado.", "danger");
                return;
            }

            const inputNome = document.getElementById('input-nome');
            const inputCpf = document.getElementById('input-cpf');
            const inputCelular = document.getElementById('input-celular');
            const inputNascimento = document.getElementById('input-nascimento');
            const inputTelefone = document.getElementById('input-telefone');

            if (inputNascimento) inputNascimento.value = cliente.data_nascimento || '';
            if (inputTelefone)inputTelefone.value = cliente.telefone || '';
            if (inputNome) inputNome.value = cliente.nome_completo;
            if (inputCpf) inputCpf.value = cliente.cpf;
            if (inputCelular) inputCelular.value = cliente.celular;


            const formTitle = document.getElementById('form-title');
            if (formTitle) {
                formTitle.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <span><i class="bi bi-pencil text-warning me-2"></i> Editar Cliente</span>
                        <button type="button" class="btn btn-sm btn-outline-danger px-2 py-0" id="btn-cancel-edit" title="Cancelar Edição">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                `;
            }

            const btnSubmit = document.querySelector('#form-cliente button[type="submit"]');
            btnSubmit.innerText = "Salvar Alterações";
            btnSubmit.classList.replace('btn-primary', 'btn-warning');

            document.getElementById('form-cliente').setAttribute('data-edit-hash', hash);
            document.getElementById('btn-cancel-edit').addEventListener('click', () => {
                ClientController.cancelarEdicao();
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {

            console.error("Erro ao carregar cliente para edição:", error);
            UIModal.showAlert("Erro", "Falha ao carregar os dados do cliente.", "danger");

        }
    }


    static async carregarTabela() {

        const tbody = document.getElementById('tabela-clientes-body');
        if (!tbody) return;

        try {

            const clientes = await ClientService.listarClientes();

            this.clientesCache = clientes || [];

            const totalPaginas = Math.ceil(this.clientesCache.length / this.itensPorPagina);
            if (this.paginaAtual > totalPaginas) {
                this.paginaAtual = totalPaginas || 1;
            }

            this.renderizarTabela();

        } catch (error) {

            console.error("Erro ao montar tabela de clientes:", error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar dados.</td></tr>';

        }
    }

    static renderizarTabela() {
        const tbody = document.getElementById('tabela-clientes-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.clientesCache.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <i class="bi bi-person-x"></i>
                            <strong>Nenhum cliente cadastrado.</strong>
                            <span>Cadastre um novo cliente para começar.</span>
                        </div>
                    </td>
                </tr>
            `;

            this.renderizarPaginacao();
            return;
        }

        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const clientesPagina = this.clientesCache.slice(inicio, fim);

        clientesPagina.forEach(cliente => {

                const tr = document.createElement('tr');

                const idCliente = cliente.id;
                const nome = cliente.nome_completo || 'Sem nome';
                const cpf = cliente.cpf || '';
                const nascimento = cliente.data_nascimento || 'Não informado';
                const telefone = cliente.telefone || 'Não informado';
                const celular = cliente.celular || 'Não informado';
                const identificador = cliente.cpf_hash;

                const cpfEstaVisivel = this.cpfsVisiveis.has(identificador);
                const cpfVisual = cpfEstaVisivel
                    ? this.formatarCpfVisual(cpf)
                    : this.mascararCpf(cpf);

            tr.innerHTML = `
                <td>
                    <div class="client-name-cell">
                        <div class="client-avatar">
                            ${this.getInitials(nome)}
                        </div>
                        <div>
                            <strong>${nome}</strong>
                            <small>Cliente cadastrado</small>
                        </div>
                    </div>
                </td>

                <td>
                    <div class="cpf-wrapper">
                        <span class="cpf-value">${cpfVisual}</span>
                        <button 
                            type="button" 
                            class="btn btn-sm btn-light btn-toggle-cpf" 
                            data-hash="${identificador}"
                            title="${cpfEstaVisivel ? 'Ocultar CPF' : 'Mostrar CPF'}"
                        >
                            <i class="bi ${cpfEstaVisivel ? 'bi-eye-slash' : 'bi-eye'}"></i>
                        </button>
                    </div>
                </td>

                <td>
                    <span class="badge-soft">
                        <i class="bi bi-calendar3 me-1"></i>
                        ${this.formatarDataVisual(nascimento)}
                    </span>
                </td>

                <td>
                    <div class="contact-cell">
                        <span><i class="bi bi-telephone text-primary me-1"></i>${this.formatarTelefoneVisual(telefone)}</span>
                        <span><i class="bi bi-phone text-success me-1"></i>${this.formatarTelefoneVisual(celular)}</span>
                    </div>
                </td>

                <td class="text-end">
                    <div class="action-buttons">
                        <a href="addresses.html?clienteId=${idCliente}" class="btn btn-sm btn-outline-primary" title="Endereços">
                            <i class="bi bi-geo-alt"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-warning btn-editar" data-hash="${identificador}" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir" data-hash="${identificador}" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        this.renderizarPaginacao();
    }

    static renderizarPaginacao() {

        const pagination = document.getElementById('clientes-pagination');
        const paginationInfo = document.getElementById('clientes-pagination-info');

        if (!pagination) return;

        const totalClientes = this.clientesCache.length;
        const totalPaginas = Math.ceil(totalClientes / this.itensPorPagina);

        pagination.innerHTML = '';

        if (paginationInfo) {
            if (totalClientes === 0) {
                paginationInfo.innerText = 'Nenhum registro encontrado';
            } else {
                const inicio = (this.paginaAtual - 1) * this.itensPorPagina + 1;
                const fim = Math.min(this.paginaAtual * this.itensPorPagina, totalClientes);
                paginationInfo.innerText = `Mostrando ${inicio} até ${fim} de ${totalClientes} cliente(s)`;
            }
        }

        if (totalPaginas <= 1) return;

        const paginaAnterior = Math.max(this.paginaAtual - 1, 1);
        const proximaPagina = Math.min(this.paginaAtual + 1, totalPaginas);

        pagination.insertAdjacentHTML('beforeend', `
            <li class="page-item ${this.paginaAtual === 1 ? 'disabled' : ''}">
                <button class="page-link" data-page="${paginaAnterior}">
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
        `);

        for (let pagina = 1; pagina <= totalPaginas; pagina++) {
            pagination.insertAdjacentHTML('beforeend', `
                <li class="page-item ${pagina === this.paginaAtual ? 'active' : ''}">
                    <button class="page-link" data-page="${pagina}">
                        ${pagina}
                    </button>
                </li>
            `);
        }

        pagination.insertAdjacentHTML('beforeend', `
            <li class="page-item ${this.paginaAtual === totalPaginas ? 'disabled' : ''}">
                <button class="page-link" data-page="${proximaPagina}">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        `);
    }

    static formatarCpfVisual(cpf) {
        if (!cpf) return 'Não informado';

        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) return cpf;

        return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    static mascararCpf(cpf) {
        if (!cpf) return '***.***.***-**';

        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) return '***.***.***-**';

        return `***.***.${cpfLimpo.substring(6, 9)}-**`;
    }

    static formatarDataVisual(data) {
        if (!data || data === 'Não informado') return 'Não informado';

        const partes = data.split('-');
        if (partes.length !== 3) return data;

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    static formatarTelefoneVisual(valor) {
        if (!valor || valor === 'Não informado') return 'Não informado';

        const numeros = valor.replace(/\D/g, '');

        if (numeros.length === 11) {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        if (numeros.length === 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }

        return valor;
    }

    static getInitials(nome) {
        if (!nome) return '?';

        const partes = nome.trim().split(' ').filter(Boolean);

        if (partes.length === 1) {
            return partes[0].substring(0, 2).toUpperCase();
        }

        return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
    }

    static configurarLimitesDataNascimento() {

        const inputNascimento = document.getElementById('input-nascimento');
        if (!inputNascimento) return;

        const hoje = new Date();

        const dataMinima = new Date(
            hoje.getFullYear() - 100,
            hoje.getMonth(),
            hoje.getDate()
        );

        const dataMaxima = new Date(
            hoje.getFullYear() - 18,
            hoje.getMonth(),
            hoje.getDate()
        );

        inputNascimento.min = this.formatarDataParaInput(dataMinima);
        inputNascimento.max = this.formatarDataParaInput(dataMaxima);
        
    }

    static formatarDataParaInput(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    }



    static async excluirCliente(hash) {

        const confirmou = await UIModal.showConfirm(
            "Excluir Cliente",
            "Tem certeza que deseja excluir este cliente? Esta ação apagará permanentemente os dados.",
            "Sim, Excluir",
            "danger"
        );

        if (!confirmou) return;

        try {
            await ClientService.excluirCliente(hash);

            UIModal.showAlert("Sucesso!", "O cliente foi removido da base de dados.", "success");

            await this.carregarTabela();

        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            UIModal.showAlert("Ops!", "Ocorreu um erro ao excluir o cliente. Verifique o console.", "warning");
        }
    }



}