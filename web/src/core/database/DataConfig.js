export class DataConfig {
    
    static dbName = 'agrosqldb';
    static storageKey = 'agrosys_database';

    /**
     * Inicializa o banco de dados AlaSQL em memória e restaura os dados do localStorage.
     * @returns {Promise<void>}
     */
    static async init() {
        try {
            alasql(`CREATE DATABASE IF NOT EXISTS ${this.dbName}`);
            alasql(`USE ${this.dbName}`);

            this.createTables();
            this.loadFromStorage();

            console.log("✅ Banco de dados inicializado com sucesso (AlaSQL + localStorage)!");
        } catch (error) {
            console.error("❌ Falha crítica ao inicializar o banco de dados:", error);
            throw error;
        }
    }

    /**
     * Cria as tabelas e garante as regras de negócio estruturais.
     */
    static createTables() {
        // ==========================================
        // TABELA: USUÁRIOS
        // ==========================================
        alasql(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTOINCREMENT PRIMARY KEY,
                username_hash STRING,
                username STRING,
                password_salt STRING,
                password_hash STRING
            )
        `);

        // ==========================================
        // TABELA: CLIENTES
        // ==========================================
        alasql(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTOINCREMENT PRIMARY KEY,
                usuario_id STRING,
                nome_completo STRING,
                cpf_hash STRING,
                cpf STRING,
                data_nascimento STRING,
                telefone STRING,
                celular STRING
            )
        `);

        // ==========================================
        // TABELA: ENDEREÇOS
        // ==========================================
        alasql(`
            CREATE TABLE IF NOT EXISTS enderecos (
                id INT AUTOINCREMENT PRIMARY KEY,
                cliente_id INT,
                cep STRING,
                rua STRING,
                numero STRING,
                complemento STRING,
                bairro STRING,
                cidade STRING,
                estado STRING,
                pais STRING,
                is_principal BOOLEAN
            )
        `);
    }

    /**
     * Carrega os dados persistidos no localStorage para dentro do AlaSQL.
     */
    static loadFromStorage() {
        const savedDatabase = localStorage.getItem(this.storageKey);

        if (!savedDatabase) return;

        try {
            const parsedDatabase = JSON.parse(savedDatabase);

            alasql('DELETE FROM usuarios');
            alasql('DELETE FROM clientes');
            alasql('DELETE FROM enderecos');

            for (const user of parsedDatabase.usuarios || []) {
                alasql('INSERT INTO usuarios ?', [user]);
            }

            for (const client of parsedDatabase.clientes || []) {
                alasql('INSERT INTO clientes ?', [client]);
            }

            for (const address of parsedDatabase.enderecos || []) {
                alasql('INSERT INTO enderecos ?', [address]);
            }
        } catch (error) {
            console.error("❌ Erro ao restaurar dados do localStorage:", error);
            localStorage.removeItem(this.storageKey);
        }
    }

    /**
     * Persiste o estado atual das tabelas no localStorage.
     */
    static persist() {
        const databaseDump = {
            usuarios: alasql('SELECT * FROM usuarios'),
            clientes: alasql('SELECT * FROM clientes'),
            enderecos: alasql('SELECT * FROM enderecos')
        };

        localStorage.setItem(this.storageKey, JSON.stringify(databaseDump));
    }

    /**
     * Helper para limpar o banco.
     */
    static clearDatabase() {
        alasql('DELETE FROM usuarios');
        alasql('DELETE FROM clientes');
        alasql('DELETE FROM enderecos');

        localStorage.removeItem(this.storageKey);

        console.log("🧹 Banco de dados limpo com sucesso.");
    }
}