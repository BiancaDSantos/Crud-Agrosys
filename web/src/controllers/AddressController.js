import { AddressService } from '../services/AddressService.js';
import { BuscaCep } from '../core/api/BuscaCep.js';

export class AddressController {
    
    static clienteIdAtual = null;

    static init() {
        
        const urlParams = new URLSearchParams(window.location.search);
        this.clienteIdAtual = urlParams.get('clienteId');

        if (!this.clienteIdAtual) {
            alert("Nenhum cliente selecionado. Redirecionando...");
            window.location.href = 'clients.html';
            return;
        }

        const form = document.getElementById('form-endereco');
        if (form) form.addEventListener('submit', this.salvarEndereco.bind(this));

        const inputCep = document.getElementById('input-cep');
        if (inputCep) inputCep.addEventListener('blur', this.lidarComBuscaCep.bind(this));

        this.carregarTabela();
    }

    /**
     * Orquestra a busca de CEP preenchendo o formulário ou liberando para digitação
     */
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

            document.getElementById('input-rua').value = dados.rua;
            document.getElementById('input-bairro').value = dados.bairro;
            document.getElementById('input-cidade').value = dados.cidade;
            document.getElementById('input-estado').value = dados.estado;
            
        } catch (error) {

            alert(error.message);
            this.liberarCamposEndereco(true);
            
        }
    }

    static liberarCamposEndereco(liberar) {
        const inputs = ['input-rua', 'input-bairro', 'input-cidade', 'input-estado'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.readOnly = !liberar;
        });
    }

    static async salvarEndereco(event) {
        event.preventDefault();

        const enderecoData = {
            cliente_id: parseInt(this.clienteIdAtual, 10),
            cep: document.getElementById('input-cep').value,
            rua: document.getElementById('input-rua').value.trim(),
            bairro: document.getElementById('input-bairro').value.trim(),
            cidade: document.getElementById('input-cidade').value.trim(),
            estado: document.getElementById('input-estado').value.trim(),
            pais: document.getElementById('input-pais').value.trim(), // Requisito do PDF
            is_principal: document.getElementById('checkbox-principal').checked
        };

        try {
            await AddressService.criarEndereco(enderecoData);
            
            alert('Endereço salvo com sucesso!');
            document.getElementById('form-endereco').reset();
            this.carregarTabela();
            
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    static async carregarTabela() {
        const tbody = document.getElementById('tabela-enderecos-body');
        if (!tbody) return;

        try {
            // Busca apenas os endereços atrelados ao cliente em questão
            const enderecos = await AddressService.listarEnderecosPorCliente(this.clienteIdAtual);
            tbody.innerHTML = '';

            if (enderecos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum endereço cadastrado.</td></tr>';
                return;
            }

            enderecos.forEach(end => {
                const badgePrincipal = end.is_principal ? '<span class="badge bg-success">Principal</span>' : '';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${end.rua}, ${end.bairro}</td>
                    <td>${end.cidade}/${end.estado}</td>
                    <td>${end.cep}</td>
                    <td>${badgePrincipal}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Erro ao montar tabela de endereços:", error);
        }
    }
}