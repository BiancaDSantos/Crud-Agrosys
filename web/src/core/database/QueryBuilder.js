import { DataConfig } from './DataConfig.js';

export class QueryBuilder {
    /**
     * Executa uma query customizada ou bruta no AlaSQL.
     * @param {string} sql
     * @param {Array} params
     * @returns {Promise<any>}
     */
    static async execute(sql, params = []) {
        try {
            const result = alasql(sql, params);
            this.#persistIfNeeded(sql);
            return result || [];
        } catch (error) {
            console.error(`[QueryBuilder] Erro ao executar query: ${sql}`, error);
            throw error;
        }
    }

    /**
     * INSERT.
     * @param {string} tabela
     * @param {Object} dados
     * @returns {Promise<any>}
     */
    static async insert(tabela, dados) {
        const colunas = Object.keys(dados).join(', ');
        const placeholders = Object.keys(dados).map(() => '?').join(', ');
        const valores = Object.values(dados);

        const sql = `INSERT INTO ${tabela} (${colunas}) VALUES (${placeholders})`;

        const result = alasql(sql, valores);
        DataConfig.persist();

        return result;
    }

    /**
     * SELECT.
     * @param {string} tableName
     * @param {string} condition
     * @param {Array} params
     * @returns {Promise<Array>}
     */
    static async select(tableName, condition = '', params = []) {
        const query = condition
            ? `SELECT * FROM ${tableName} WHERE ${condition}`
            : `SELECT * FROM ${tableName}`;

        const result = alasql(query, params);

        return result || [];
    }

    /**
     * UPDATE.
     * @param {string} tabela
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

        const result = alasql(sql, parametrosFinais);
        DataConfig.persist();

        return result;
    }

    /**
     * DELETE.
     * @param {string} tabela
     * @param {string} condicoes
     * @param {Array} params
     * @returns {Promise<any>}
     */
    static async delete(tabela, condicoes, params = []) {
        if (!condicoes) {
            throw new Error("[QueryBuilder] Não é permitido executar DELETE sem uma cláusula WHERE.");
        }

        const query = `DELETE FROM ${tabela} WHERE ${condicoes}`;
        const result = alasql(query, params);

        DataConfig.persist();

        return result;
    }

    static #persistIfNeeded(sql) {
        const command = sql.trim().split(/\s+/)[0].toUpperCase();

        const shouldPersist = ['INSERT', 'UPDATE', 'DELETE'].includes(command);

        if (shouldPersist) {
            DataConfig.persist();
        }
    }
}