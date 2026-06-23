# 🌾 Agrosys - Projeto CRUD Web

## 📌 Sobre o Projeto
Esta é uma aplicação Web desenvolvida para a Avaliação Técnica da Agrosys. O objetivo principal é entregar um sistema funcional para o cadastro e gerenciamento de clientes e seus endereços, operando inteiramente no lado do cliente com persistência local de dados.

A base de código foi estruturada sob as premissas da **Clean Architecture** e princípios fundamentais de engenharia de software, como **SOLID** e **DRY**. Em vez de acoplar manipulação de DOM, regras de negócio e consultas SQL em scripts monolíticos, o sistema foi modularizado. Essa separação de responsabilidades garante alta coesão, facilita a manutenção e prepara o projeto para escalabilidade.

## 🚀 Funcionalidades Atendidas

* **Autenticação e Gestão de Usuários:**
  * Tela de login e formulário para cadastro de novos usuários na própria interface.
  * Validação que impede a duplicidade de usuários cadastrados.
* **Cadastro de Clientes:**
  * Inserção e listagem contendo: Nome completo, CPF, Data Nascimento, Telefone e Celular.
  * Regra de negócio estrita que bloqueia cadastros com CPFs já existentes.
* **Gestão de Endereços:**
  * Vínculo de 1 ou mais endereços por cliente.
  * Campos obrigatórios: CEP, Rua, Bairro, Cidade, Estado, País e Identificador do cliente.
  * Regra de negócio que exige a marcação obrigatória de um endereço como principal.
* **Manipulação de Banco de Dados:**
  * Tela de "configurações" com funcionalidade de upload (importação) para popular o banco de dados.
  * Exportação do banco de dados atual para o formato JSON.

## 🛠️ Stack Tecnológica & Decisões Arquiteturais
* **Frontend Core:** HTML5, CSS3 e JavaScript Vanilla.
* **UI & Responsividade:** Bootstrap (garantindo o cumprimento do requisito *Mobile Friendly*).
* **Database:** [AlaSQL](https://github.com/AlaSQL/alasql). Motor SQL completo para JavaScript que roda diretamente no navegador, dispensando SGBDs externos.

### ⚡ Por que IndexedDB e não LocalStorage?
Embora a documentação da avaliação forneça um exemplo didático utilizando `localStorage` para facilitar a implementação, este projeto optou por configurar o plugin AlaSQL nativamente com o **IndexedDB**. 
* **Justificativa Técnica:** O `localStorage` é síncrono e bloqueia a *main thread* do JavaScript durante operações de I/O. O uso do **IndexedDB** garante operações assíncronas e suporta um volume massivo de dados sem degradar a performance da interface ou causar travamentos na experiência do usuário.

## 📂 Arquitetura do Sistema
O projeto utiliza **ES6 Modules** para isolar os contextos da aplicação:
* **`controllers/`**: Intermediários que capturam eventos da View (HTML/DOM) e delegam ações.
* **`services/`**: Concentram as regras de negócio puras e validações, mantendo a lógica isolada e facilmente testável.
* **`repositories/`**: Única camada com permissão para conhecer e interagir com o AlaSQL (consultas `INSERT`, `SELECT`), blindando a aplicação da infraestrutura de dados.

## 🛡️ Nota sobre Segurança da Informação (Security Caveat)
Este projeto atende ao requisito de utilizar o AlaSQL para persistência no navegador. Contudo, é importante destacar uma ressalva técnica com base nas diretrizes de segurança da **OWASP**:

O armazenamento *client-side* de Informações Pessoalmente Identificáveis (PII) — como CPF, contatos e endereços — expõe a aplicação a vulnerabilidades de *Cross-Site Scripting* (XSS), independentemente de utilizar `localStorage` ou `IndexedDB`. 

Em uma arquitetura corporativa de produção, o banco de dados operaria isolado em uma API backend, e a persistência de estado/autenticação não seria delegada ao navegador, sendo implementada por meio de mecanismos mais seguros, como a emissão de tokens JWT validados em **cookies `HttpOnly`**. A atual implementação no lado do cliente foi realizada exclusivamente para fins de demonstração técnica deste escopo.

## ⚙️ Como Executar
O projeto foi desenhado para rodar localmente. Devido ao uso de módulos ES6 nativos, abrir o arquivo `index.html` diretamente pode causar erros de CORS no navegador.

**Passo a passo:**
1. Descompacte a pasta do projeto.
2. Inicie um servidor estático local na raiz do diretório (Ex: usando a extensão *Live Server* no VS Code, ou rodando `npx serve` / `npx vite` no terminal).
3. Acesse a aplicação pela porta disponibilizada.
4. Consulte o arquivo `INFO.txt` anexo para detalhes operacionais da avaliação.
