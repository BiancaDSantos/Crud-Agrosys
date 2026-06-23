export class DataConfig {
    
    static dbName = 'agrosqldb';

    /**
     * Inicializa o banco de dados AlaSQL utilizando IndexedDB.
     * @returns {Promise<void>}
     */
    static init() {
        return new Promise((resolve, reject) => {
            try {
                
                alasql(`CREATE INDEXEDDB DATABASE IF NOT EXISTS ${this.dbName}`, () => {
                    
                    
                    alasql(`ATTACH INDEXEDDB DATABASE ${this.dbName}`, () => {
                        
                        
                        alasql(`USE ${this.dbName}`);

                        this.createTables();
                        
                        console.log("✅ Banco de dados inicializado com sucesso (IndexedDB)!");
                        resolve();

                    });
                });
            } catch (error) {
                console.error("❌ Falha crítica ao inicializar o banco de dados:", error);
                reject(error);
            }
        });
    }

    /**
     * Cria as tabelas e garante as regras de negócio estruturais (UNIQUE, chaves estrangeiras lógicas).
     */
    static createTables() {
        // ==========================================
        // TABELA: USUÁRIOS
        // ==========================================
        alasql(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTOINCREMENT PRIMARY KEY,
                username_hash STRING UNIQUE,
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
                nome_completo STRING,
                cpf_hash STRING UNIQUE,
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
                bairro STRING,
                cidade STRING,
                estado STRING,
                pais STRING,
                is_principal BOOLEAN
            )
        `);
    }

    /**
     * Helper para limpar o banco (útil para a tela de configurações/upload)
     */
    static clearDatabase() {
        alasql('DELETE FROM usuarios');
        alasql('DELETE FROM clientes');
        alasql('DELETE FROM enderecos');
        console.log("🧹 Banco de dados limpo com sucesso.");
    }
}