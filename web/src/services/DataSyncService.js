import { QueryBuilder } from '../core/database/QueryBuilder.js';

export class DataSyncService {
    
    /**
     * Exporta as tabelas do banco de dados para um arquivo JSON e força o download.
     */
    static async exportDatabase() {
        try {
            
            const usuarios = await QueryBuilder.execute('SELECT * FROM usuarios');
            const clientes = await QueryBuilder.execute('SELECT * FROM clientes');
            const enderecos = await QueryBuilder.execute('SELECT * FROM enderecos');

            const clientesComEnderecos = clientes.map((cliente) => {
                const enderecosDoCliente = enderecos.filter((endereco) => {
                    return Number(endereco.cliente_id) === Number(cliente.id);
                });

                return {
                    ...cliente,
                    enderecos: enderecosDoCliente
                };
            });

            const databaseDump = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                data: {
                    usuarios,
                    clientes: clientesComEnderecos,
                    enderecos
                }
            };

            const jsonString = JSON.stringify(databaseDump, null, 2);
            this.#triggerDownload(jsonString, `agrosys_backup_${Date.now()}.json`);
            
            return { success: true };
        } catch (error) {
            throw new Error(`Falha ao exportar banco de dados: ${error.message}`);
        }
    }

    /**
     * Importa um arquivo JSON, substituindo o banco atual.
     * @param {File} file - Arquivo capturado via input type="file"
     */
    static async importDatabase(file) {
        if (!file) {
            throw new Error("Nenhum arquivo selecionado.");
        }

        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            throw new Error("O arquivo deve ser um JSON válido.");
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target.result);

                    this.#validateImportContent(content);

                    const usuarios = content.data.usuarios || [];
                    const clientes = content.data.clientes || [];
                    const enderecos = this.#extractEnderecos(content);

                    await this.#clearDatabase();

                    for (const user of usuarios) {
                        await QueryBuilder.insert('usuarios', user);
                    }

                    for (const client of clientes) {
                        const { enderecos, ...clientData } = client;
                        await QueryBuilder.insert('clientes', clientData);
                    }

                    for (const address of enderecos) {
                        await QueryBuilder.insert('enderecos', address);
                    }

                    await this.#forcePersist();

                    resolve({
                        success: true,
                        message: `Banco restaurado com sucesso. Foram importados ${usuarios.length} usuário(s), ${clientes.length} cliente(s) e ${enderecos.length} endereço(s). Faça login novamente.`
                    });

                } catch (error) {
                    reject(new Error(`Erro ao processar importação: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error("Não foi possível ler o arquivo selecionado."));
            };

            reader.readAsText(file);
        });
    }

    static #validateImportContent(content) {
        if (!content || typeof content !== 'object') {
            throw new Error("O arquivo JSON está vazio ou inválido.");
        }

        if (!content.data || typeof content.data !== 'object') {
            throw new Error("A estrutura do arquivo JSON é inválida. Campo 'data' não encontrado.");
        }

        if (!Array.isArray(content.data.clientes)) {
            throw new Error("A estrutura do arquivo JSON é inválida. Campo 'data.clientes' deve ser uma lista.");
        }

        if (content.data.usuarios && !Array.isArray(content.data.usuarios)) {
            throw new Error("A estrutura do arquivo JSON é inválida. Campo 'data.usuarios' deve ser uma lista.");
        }

        if (content.data.enderecos && !Array.isArray(content.data.enderecos)) {
            throw new Error("A estrutura do arquivo JSON é inválida. Campo 'data.enderecos' deve ser uma lista.");
        }
    }

    static #extractEnderecos(content) {
        const enderecosDiretos = Array.isArray(content.data.enderecos)
            ? content.data.enderecos
            : [];

        const enderecosDentroDosClientes = content.data.clientes.flatMap((client) => {
            return Array.isArray(client.enderecos) ? client.enderecos : [];
        });

        const todosEnderecos = [
            ...enderecosDiretos,
            ...enderecosDentroDosClientes
        ];

        const enderecosUnicos = new Map();

        for (const endereco of todosEnderecos) {
            const chave = endereco.id
                ? `id-${endereco.id}`
                : `${endereco.cliente_id}-${endereco.cep}-${endereco.rua}-${endereco.numero || ''}`;

            if (!enderecosUnicos.has(chave)) {
                enderecosUnicos.set(chave, endereco);
            }
        }

        return Array.from(enderecosUnicos.values());
    }

    static async #clearDatabase() {
        await QueryBuilder.execute('DELETE FROM usuarios');
        await QueryBuilder.execute('DELETE FROM clientes');
        await QueryBuilder.execute('DELETE FROM enderecos');
    }

    static async #forcePersist() {
        if (typeof localStorage === 'undefined') return;

        try {
            const usuarios = await QueryBuilder.execute('SELECT * FROM usuarios');
            const clientes = await QueryBuilder.execute('SELECT * FROM clientes');
            const enderecos = await QueryBuilder.execute('SELECT * FROM enderecos');

            localStorage.setItem('agrosys_database', JSON.stringify({
                usuarios,
                clientes,
                enderecos
            }));
        } catch (error) {
            console.warn("Não foi possível persistir manualmente no localStorage:", error);
        }
    }

    static #triggerDownload(jsonContent, fileName) {
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}