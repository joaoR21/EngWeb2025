# TPC4

Pretende-se construir um serviço recorrendo ao express, que consuma a API de dados servida pelo json-server com as informações dos filmes, e responda com as páginas web do site.  
As páginas web implementadas são as seguintes:

- `página principal` lista de dados consultáveis

- `Listagem dos filmes` tabela com título, ano, elenco com os atores que participam e géneros do filme
    - ainda existem as opções para editar ou apagar os dados do filme.

- `Página do ator` listagem dos filmes que um dado ator participa

O ficheiro **cinema.json** foi modificado de forma a associar um identificador único a cada filme.

## Resultados
O código da solução pode ser encontrado nos seguintes ficheiros:  
[cinema.js](https://github.com/joaoR21/EngWeb2025/blob/main/TPC4/routes/cinema.js) - ficheiro com a implementação da lógica do servidor web, incluindo o fetching dos dados a partir do json-server  
`ficheiros .pug` (disponíveis em [views](https://github.com/joaoR21/EngWeb2025/blob/main/TPC4/views)) - ficheiros com a implementação das páginas web no formato `.pug`

## Autor

| Nome  | Número mecanográfico |  
|-------|----------------------|  
| João Ricardo Oliveira Macedo | A104080 | 