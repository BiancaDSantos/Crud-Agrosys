
export class QueryBuilder {
    /**
     * Executa uma query customizada ou bruta no AlaSQL.
     * Envolve a execução em uma Promise nativa para garantir "o fluxo assíncrono do IndexedDB.
     * * @param {string} sql
     * @param {Array} params
     * @returns {Promise<any>}
     */
    static execute(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                
                alasql(sql, params, function(resultado) {
                    resolve(resultado);
                });
            } catch (error) {
                console.error(`[QueryBuilder] Erro ao executar query: ${sql}`, error);
                reject(error);
            }
        });
    }

    /**
     * INSERT.
     * * @param {string} tabela
     * @param {Object} dados
     * @returns {Promise<any>}
     */
    static async insert(tabela, dados) {

        const colunas = Object.keys(dados).join(', ');
        
        const placeholders = Object.keys(dados).map(() => '?').join(', ');
        const valores = Object.values(dados);

        const sql = `INSERT INTO ${tabela} (${colunas}) VALUES (${placeholders})`;
        
        return this.execute(sql, valores);
    }

    /**
     * SELECT.
     * * @param {string} tabela
     * @param {string} condicoes
     * @param {Array} params
     * @returns {Promise<Array>}
     */
    static async select(tableName, condition = '', params = []) {
        const query = condition ? `SELECT * FROM ${tableName} WHERE ${condition}` : `SELECT * FROM ${tableName}`;
        const rawResults = await alasql.promise(query, params);
        
        if (!rawResults) return [];
        
        return rawResults.map(wrapper => Object.values(wrapper)[0]);
        
    }
    /**
     * UPDATE.
     * * @param {string} tabela
     * @param {Object} dados
     * @param {string} condicoes
     * @param {Array} paramsCondicoes
     * @returns {Promise<any>}
     */
    static async update(tabela, dados, condicoes, paramsCondicoes = []) {

        if (!condicoes) {
            throw new Error("[QueryBuilder] Não é permitido executar UPDATE sem uma cláusula WHERE.");
        }

        const setClause = Object.keys(dados).map(chave => `${chave} = ?`).join(', ');
        const valoresUpdate = Object.values(dados);

        const sql = `UPDATE ${tabela} SET ${setClause} WHERE ${condicoes}`;
        
        
        const parametrosFinais = [...valoresUpdate, ...paramsCondicoes];

        return this.execute(sql, parametrosFinais);
    }

    /**
     * DELETE.
     * * @param {string} tabela
     * @param {string} condicoes
     * @param {Array} params
     * @returns {Promise<any>}
     */
    static async delete(tabela, condicoes, params = []) {
        if (!condicoes) {
            throw new Error("[QueryBuilder] Não é permitido executar DELETE sem uma cláusula WHERE.");
        }

        const sql = `DELETE FROM ${tabela} WHERE ${condicoes}`;
        return this.execute(sql, params);
    }
}