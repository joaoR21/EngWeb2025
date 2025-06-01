# Relatório

## 1. Introdução

Este projeto visa desenvolver uma aplicação web que funcione como um diário digital pessoal e um repositório de artefactos digitais do utilizador. A aplicação organiza os conteúdos de forma cronológica, permitindo ao utilizador gerir uma variedade de informações como fotografias, registos desportivos, resultados académicos, entre outros.

## 2. Arquitetura e Modelo de Dados

A arquitetura do sistema é baseada no modelo **OAIS (Open Archival Information System)**, que define a interação entre Produtores, Administradores e Consumidores de informação, e gere três tipos principais de pacotes de informação:

* **SIP (Submission Information Package):** pacotes submetidos pelos produtores, em formato ZIP, contendo os ficheiros de dados e metainformação (em `manifesto-SIP.json`). Estes pacotes devem seguir a especificação **BagIt** para a sua estrutura e validação.
* **AIP (Archival Information Package):** após o processamento do SIP, a informação é arquivada como um AIP. Este projeto adota uma abordagem híbrida, com metadados armazenados numa base de dados mongoDB e os ficheiros associados guardados no sistema de ficheiros do servidor, numa estrutura organizada para evitar a colocação de todos os ficheiros numa única pasta.
* **DIP (Dissemination Information Package):** pacotes disponibilizados aos consumidores, que podem assumir a forma de uma interface web para consulta online ou um ficheiro ZIP para download, com estrutura semelhante ao SIP.

## 3. Funcionalidades

A aplicação implementa um conjunto de funcionalidades essenciais:

* **Gestão de Recursos Digitais:**
    * **ingestão:** processo de submissão de SIPs, que inclui validação do manifesto e dos ficheiros, e o armazenamento da metainformação na base de dados e dos ficheiros no sistema de ficheiros.
    * **linha temporal (timeline):** a interface principal para navegação e visualização dos recursos é organizada cronologicamente.
    * **tipos de recursos e taxonomia:** suporte para diversos tipos de recursos (ex.: fotos, registos académicos, atividades desportivas) através de uma taxonomia definida.
    * **metadados detalhados:** cada recurso é descrito por um conjunto de metadados (título, data de criação, produtor, tipo, descrição, tags, campos personalizados) que suportam a pesquisa e filtragem.
    * **visibilidade:** recursos podem ser marcados como públicos (visíveis no frontend público) ou privados (visíveis apenas nos perfis do proprietário ou administrador).
    * **classificação e pesquisa:** utilização de tags e tipos de recursos para facilitar a pesquisa e a navegação semântica, alternativa à navegação cronológica.
    * **exportação (DIP):** a aplicação gera um ZIP contendo o recurso e os seus metadados, para download pelo utilizador.

* **Gestão de Utilizadores e Autenticação:**
    * Sistema de autenticação com utilizador/password (jwt).
    * Distinção entre utilizadores com diferentes níveis de permissão (ex.: 'consumer', 'producer', 'admin').

* **Interface de Administração:**
    * **gestão de utilizadores:** registo, listagem, edição e remoção de utilizadores.
    * **gestão de recursos:** listagem, edição (incluindo tornar público/privado) e remoção de todos os recursos do sistema.
    * **gestão de notícias:** criação, edição e controlo de visibilidade de notícias para a página inicial.
    * **estatísticas:** visualização de estatísticas de utilização da plataforma.

## Autores
* João Ricardo Oliveira Macedo : A104080
* Filipe Lopes Fernandes : A104185
* Nuno Aguiar : A100480
