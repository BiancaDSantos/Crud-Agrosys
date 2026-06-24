import { AddressService } from '../services/AddressService.js';
import { BuscaCep } from '../core/api/BuscaCep.js';

export class AddressController {
    
    static clienteIdAtual = null;
    static enderecosCache = [];

    static init() {
        
        const urlParams = new URLSearchParams(window.location.search);
        this.clienteIdAtual = urlParams.get('clienteId');

        if (!this.clienteIdAtual || isNaN(parseInt(this.clienteIdAtual, 10))) {
            alert("Nenhum cliente válido foi selecionado. Redirecionando...");
            window.location.href = 'clientes.html'; 
            return;
        }

        const form = document.getElementById('form-endereco');
        if (form) form.addEventListener('submit', this.salvarEndereco.bind(this));

        const inputCep = document.getElementById('input-cep');
        if (inputCep) inputCep.addEventListener('blur', this.lidarComBuscaCep.bind(this));

        const tbody = document.getElementById('tabela-enderecos-body');
        if (tbody) {
            tbody.addEventListener('click', async (event) => {
                const btnEditar = event.target.closest('.btn-editar-endereco');
                if (btnEditar) {
                    const id = btnEditar.getAttribute('data-id');
                    this.carregarEnderecoParaEdicao(id);
                    return;
                }

                const btnExcluir = event.target.closest('.btn-excluir-endereco');
                if (btnExcluir) {
                    const id = btnExcluir.getAttribute('data-id');
                    await this.excluirEndereco(id);
                }
            });
        }

        this.carregarTabela();
    }

    static async lidarComBuscaCep(event) {

        const cepDigitado = event.target.value;
        if (cepDigitado.replace(/\D/g, '').length !== 8) return;

        try {
            const dados = await BuscaCep.buscarCep(cepDigitado);
            
            if (dados === null) {
                alert("CEP não encontrado na base dos Correios. Por favor, preencha manualmente.");
                this.liberarCamposEndereco(true);
                return;
            }

            const inputRua = document.getElementById('input-rua');
            const inputBairro = document.getElementById('input-bairro');
            const inputCidade = document.getElementById('input-cidade');
            const inputEstado = document.getElementById('input-estado');

            if (inputRua) inputRua.value = dados.rua || '';
            if (inputBairro) inputBairro.value = dados.bairro || '';

            this.definirValorSelect(inputEstado, dados.estado, dados.estado);
            this.definirValorSelect(inputCidade, dados.cidade, dados.cidade);

            if (inputCidade) {
                inputCidade.disabled = false;
            }

            this.liberarCamposEndereco(false);
            
        } catch (error) {

            alert(error.message);
            this.liberarCamposEndereco(true);
            
        }
    }

    static definirValorSelect(selectElement, valor, texto) {
        if (!selectElement || !valor) return;

        const valorNormalizado = String(valor).trim();

        let optionExistente = Array.from(selectElement.options).find((option) => {
            return option.value === valorNormalizado;
        });

        if (!optionExistente) {
            optionExistente = document.createElement('option');
            optionExistente.value = valorNormalizado;
            optionExistente.textContent = texto || valorNormalizado;
            selectElement.appendChild(optionExistente);
        }

        selectElement.value = valorNormalizado;
    }

    static liberarCamposEndereco(liberar) {
        const inputRua = document.getElementById('input-rua');
        const inputBairro = document.getElementById('input-bairro');
        const inputCidade = document.getElementById('input-cidade');
        const inputEstado = document.getElementById('input-estado');

        if (inputRua) inputRua.readOnly = !liberar;
        if (inputBairro) inputBairro.readOnly = !liberar;

        if (inputEstado) {
            inputEstado.disabled = false;
        }

        if (inputCidade) {
            inputCidade.disabled = false;
        }
    }

    static async salvarEndereco(event) {
        event.preventDefault();

        const form = document.getElementById('form-endereco');
        const editId = form.getAttribute('data-edit-id');

        const enderecoData = {
            cliente_id: parseInt(this.clienteIdAtual, 10),
            cep: document.getElementById('input-cep').value,
            rua: document.getElementById('input-rua').value.trim(),
            numero: document.getElementById('input-numero').value.trim(),
            complemento: document.getElementById('input-complemento').value.trim(),
            bairro: document.getElementById('input-bairro').value.trim(),
            cidade: document.getElementById('input-cidade').value.trim(),
            estado: document.getElementById('input-estado').value.trim(),
            pais: document.getElementById('input-pais').value.trim(),
            is_principal: document.getElementById('checkbox-principal').checked
        };

        try {
            if (editId) {
                await AddressService.atualizarEndereco(editId, enderecoData);
                alert('Endereço atualizado com sucesso!');
                this.cancelarEdicao();
            } else {
                await AddressService.criarEndereco(enderecoData);
                alert('Endereço salvo com sucesso!');
                form.reset();
            }

            await this.carregarTabela();
            
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    static async carregarTabela() {
        const tbody = document.getElementById('tabela-enderecos-body');
        if (!tbody) return;

        try {
            const enderecos = await AddressService.listarEnderecosPorCliente(this.clienteIdAtual);
            this.enderecosCache = enderecos || [];
            tbody.innerHTML = '';

            if (enderecos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum endereço cadastrado.</td></tr>';
                return;
            }

            enderecos.forEach(end => {
                const badgePrincipal = end.is_principal ? '<span class="badge bg-success">Principal</span>' : '<span class="badge bg-secondary">Secundário</span>';
                const complemento = end.complemento ? ` - ${end.complemento}` : '';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <strong>${end.rua}, ${end.numero}</strong>${complemento}
                        <br>
                        <small class="text-muted">${end.bairro}</small>
                    </td>
                    <td>${end.cidade}/${end.estado}</td>
                    <td>${this.formatarCepVisual(end.cep)}</td>
                    <td>${badgePrincipal}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning btn-editar-endereco me-1" data-id="${end.id}" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-excluir-endereco" data-id="${end.id}" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Erro ao montar tabela de endereços:", error);
        }
    }

    static carregarEnderecoParaEdicao(id) {
        const endereco = this.enderecosCache.find((item) => String(item.id) === String(id));

        if (!endereco) {
            alert("Endereço não encontrado.");
            return;
        }

        document.getElementById('input-cep').value = endereco.cep || '';
        document.getElementById('input-rua').value = endereco.rua || '';
        document.getElementById('input-numero').value = endereco.numero || '';
        document.getElementById('input-complemento').value = endereco.complemento || '';
        document.getElementById('input-bairro').value = endereco.bairro || '';
        document.getElementById('input-pais').value = endereco.pais || 'Brasil';
        document.getElementById('checkbox-principal').checked = Boolean(endereco.is_principal);

        this.definirValorSelect(document.getElementById('input-estado'), endereco.estado, endereco.estado);
        this.definirValorSelect(document.getElementById('input-cidade'), endereco.cidade, endereco.cidade);

        const form = document.getElementById('form-endereco');
        form.setAttribute('data-edit-id', endereco.id);

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.innerText = 'Salvar Alterações';
            btnSubmit.classList.remove('btn-primary');
            btnSubmit.classList.add('btn-warning');
        }

        this.adicionarBotaoCancelarEdicao();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    static adicionarBotaoCancelarEdicao() {
        const form = document.getElementById('form-endereco');
        if (!form || document.getElementById('btn-cancelar-edicao-endereco')) return;

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (!btnSubmit) return;

        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.id = 'btn-cancelar-edicao-endereco';
        btnCancelar.className = 'btn btn-outline-secondary w-100 rounded-3 mt-2';
        btnCancelar.innerText = 'Cancelar Edição';

        btnCancelar.addEventListener('click', () => {
            this.cancelarEdicao();
        });

        btnSubmit.insertAdjacentElement('afterend', btnCancelar);
    }

    static cancelarEdicao() {
        const form = document.getElementById('form-endereco');
        if (!form) return;

        form.reset();
        form.removeAttribute('data-edit-id');

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.innerText = 'Salvar Endereço';
            btnSubmit.classList.remove('btn-warning');
            btnSubmit.classList.add('btn-primary');
        }

        const btnCancelar = document.getElementById('btn-cancelar-edicao-endereco');
        if (btnCancelar) {
            btnCancelar.remove();
        }
    }

    static async excluirEndereco(id) {
        const confirmou = confirm("Tem certeza que deseja excluir este endereço?");

        if (!confirmou) return;

        try {
            await AddressService.excluirEndereco(id);
            alert("Endereço excluído com sucesso!");
            await this.carregarTabela();
        } catch (error) {
            alert(`Erro ao excluir endereço: ${error.message}`);
        }
    }

    static formatarCepVisual(cep) {
        if (!cep) return '';

        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return cep;

        return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
}