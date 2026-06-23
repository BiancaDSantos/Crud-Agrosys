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

            const databaseDump = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                data: {
                    usuarios,
                    clientes,
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
     * Importa um arquivo JSON pré-populado, substituindo o banco atual.
     * @param {File} file - Arquivo capturado via input type="file"
     */
    static async importDatabase(file) {
        if (!file) throw new Error("Nenhum arquivo selecionado.");
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            throw new Error("O arquivo deve ser um JSON válido.");
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    
                    if (!content.data || !content.data.clientes) {
                        throw new Error("A estrutura do arquivo JSON é inválida ou incompatível.");
                    }
                    
                    await QueryBuilder.execute('DELETE FROM usuarios');
                    await QueryBuilder.execute('DELETE FROM clientes');
                    await QueryBuilder.execute('DELETE FROM enderecos');

                    for (const user of content.data.usuarios || []) {
                        await QueryBuilder.insert('usuarios', user);
                    }
                    for (const client of content.data.clientes || []) {
                        await QueryBuilder.insert('clientes', client);
                    }
                    for (const address of content.data.enderecos || []) {
                        await QueryBuilder.insert('enderecos', address);
                    }

                    resolve({ success: true, message: "Banco de dados restaurado com sucesso. Faça login novamente." });

                } catch (error) {

                    reject(new Error(`Erro ao processar importação: ${error.message}`));

                }
            };

            reader.readAsText(file);
        });
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