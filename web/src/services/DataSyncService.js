import { QueryBuilder } from '../core/database/QueryBuilder.js';
import { EncryptionService } from '../core/security/EncryptionService.js';
import { SecureStorage } from '../core/security/SecureStorage.js';

export class DataSyncService {

    static camposClientes = ['nome_completo', 'cpf', 'data_nascimento', 'telefone', 'celular'];
    static camposEnderecos = ['cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'pais'];

    static async exportDatabase(usuarioId) {
        
        const currentUser = SecureStorage.getItem('currentUser');
        const userId = currentUser?.id || currentUser?.username || currentUser || usuarioId;

        if (!userId) {
            throw new Error('Usuário não identificado na sessão.');
        }

        try {
            const todosClientes = await QueryBuilder.execute(`SELECT * FROM clientes`);
            const clientesRaw = (todosClientes || []).filter(
                c => String(c.usuario_id) === String(userId)
            );

            let enderecosRaw = [];
            if (clientesRaw.length > 0) {
                const idsClientes = clientesRaw.map(c => Number(c.id));
                const todosEnderecos = await QueryBuilder.execute(`SELECT * FROM enderecos`);
                enderecosRaw = (todosEnderecos || []).filter(
                    e => idsClientes.includes(Number(e.cliente_id))
                );
            }

            const clientes = await Promise.all(clientesRaw.map(c => DataSyncService.#decryptRecord(c, DataSyncService.camposClientes, 'Clientes')));
            const enderecos = await Promise.all(enderecosRaw.map(e => DataSyncService.#decryptRecord(e, DataSyncService.camposEnderecos, 'Endereços')));

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
                usuarioExportacao: userId,
                data: {
                    clientes: clientesComEnderecos
                }
            };

            const jsonString = JSON.stringify(databaseDump, null, 2);
            DataSyncService.#triggerDownload(jsonString, `backup_clientes_${Date.now()}.json`);

            return { success: true };
        } catch (error) {
            console.error("🚨 Erro fatal na exportação:", error);
            throw new Error(`Falha ao exportar banco de dados: ${error.message}`);
        }
    }

    static async importDatabase(file) {
        let content;
        try {
            const fileText = await file.text();
            content = JSON.parse(fileText);
        } catch (error) {
            throw new Error("Não foi possível ler o arquivo. Verifique se é um JSON válido.");
        }

        DataSyncService.#validateImportContent(content);

        const clientesImportados = content.data.clientes;

        try {
            
            const currentUser = SecureStorage.getItem('currentUser');
            const userId = currentUser?.id || currentUser?.username || currentUser;

            if (!userId) {
                throw new Error('Usuário não identificado na sessão para importar os dados.');
            }

            await DataSyncService.#clearUserDatabase(userId);


            for (const cliente of clientesImportados) {
                const cpfLimpo = String(cliente.cpf || '').replace(/\D/g, '');
                const cpfHash = await EncryptionService.hash(cpfLimpo);

                const clienteCriptografado = {
                    usuario_id: userId,
                    cpf_hash: cpfHash
                };


                for (const campo of DataSyncService.camposClientes) {
                    const valor = campo === 'cpf' ? cpfLimpo : (cliente[campo] ?? '');
                    clienteCriptografado[campo] = await EncryptionService.encrypt(String(valor));
                }


                await QueryBuilder.insert('clientes', clienteCriptografado);

                const todosOsClientes = await QueryBuilder.select('clientes');
                const candidatos = (todosOsClientes || []).filter(c => c.cpf_hash === cpfHash);
                const clienteRecemInserido = candidatos.length > 0
                    ? candidatos.reduce((maisRecente, atual) => Number(atual.id) > Number(maisRecente.id) ? atual : maisRecente)
                    : null;
                const novoId = clienteRecemInserido?.id != null ? Number(clienteRecemInserido.id) : null;

                if (novoId === null) {
                    console.warn(`⚠️ [IMPORT] Não foi possível localizar o cliente recém-inserido (cpf_hash: ${cpfHash}). Endereços deste cliente não serão importados.`);
                }


                if (novoId !== null && Array.isArray(cliente.enderecos)) {
                    for (const endereco of cliente.enderecos) {
                        const enderecoCriptografado = {
                            cliente_id: Number(novoId),
                            is_principal: Boolean(endereco.is_principal)
                        };

                        for (const campo of DataSyncService.camposEnderecos) {
                            const valor = endereco[campo] ?? '';
                            enderecoCriptografado[campo] = await EncryptionService.encrypt(String(valor));
                        }

                        await QueryBuilder.insert('enderecos', enderecoCriptografado);
                    }
                }
            }

            await DataSyncService.#forcePersist();

            return { success: true, message: "Banco de dados importado com sucesso!" };

        } catch (error) {
            console.error("🚨 Erro fatal na importação:", error);
            throw new Error(`Falha ao importar banco de dados: ${error.message}`);
        }
    }

    static async #clearUserDatabase(userId) {
        try {
            const todosClientes = await QueryBuilder.execute(`SELECT * FROM clientes`);
            const clientesDoUsuario = (todosClientes || []).filter(c => String(c.usuario_id) === String(userId));
            const idsClientesDoUsuario = clientesDoUsuario.map(c => Number(c.id));

            const todosEnderecos = await QueryBuilder.execute(`SELECT * FROM enderecos`);
            const enderecosDoUsuario = (todosEnderecos || []).filter(
                e => idsClientesDoUsuario.includes(Number(e.cliente_id))
            );

            for (const endereco of enderecosDoUsuario) {
                await QueryBuilder.delete('enderecos', `id = ${Number(endereco.id)}`);
            }

            for (const cliente of clientesDoUsuario) {
                await QueryBuilder.delete('clientes', `id = ${Number(cliente.id)}`);
            }
        } catch (error) {
            console.warn("Aviso ao tentar limpar o banco do usuário antes da importação:", error);
        }
    }

    static async #decryptRecord(record, encryptedFields, tableName = 'Desconhecida') {
        const decryptedRecord = { ...record };

        for (const field of encryptedFields) {

            const rawValue = decryptedRecord[field];


            if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
                try {
                    decryptedRecord[field] = await EncryptionService.decrypt(String(rawValue));
                } catch (e) {

                    console.group(`🚨 Falha de Criptografia: [${tableName}] ID: ${record.id} | Campo: '${field}'`);
                    console.error("Mensagem de erro do EncryptionService:", e.message);
                    console.warn("Dado que causou a falha (Pode ser de outro usuário ou texto plano):", rawValue);
                    console.groupEnd();

                    decryptedRecord[field] = `[FALHA_DECRYPT] ${rawValue}`;
                }
            }
        }

        return decryptedRecord;
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

    }

    static async #forcePersist() {
        if (typeof localStorage === 'undefined') return;
        try {
            const usuarios = await QueryBuilder.execute('SELECT * FROM usuarios');
            const clientes = await QueryBuilder.execute('SELECT * FROM clientes');
            const enderecos = await QueryBuilder.execute('SELECT * FROM enderecos');

            localStorage.setItem('agrosys_database', JSON.stringify({ usuarios, clientes, enderecos }));
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