
export class IbgeClient {

    static baseUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

    static async listarEstados() {
        try {

            const response = await fetch(`${this.baseUrl}/estados?orderBy=nome`);
            return await response.json();

        } catch (error) {

            console.error("Erro ao buscar Estados no IBGE:", error);
            return [];

        }
    }

    /**
     * Retorna a lista de cidades pertencentes a um Estado específico.
     * @param {string} uf
     */
    static async listarCidadesPorEstado(uf) {
        try {

            const response = await fetch(`${this.baseUrl}/estados/${uf}/municipios?orderBy=nome`);
            return await response.json();
            
        } catch (error) {

            console.error(`Erro ao buscar Cidades para a UF ${uf}:`, error);
            return [];
            
        }
    }
}