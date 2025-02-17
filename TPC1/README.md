# TPC1

Pretende-se construir um serviço em nodejs, que consuma a API de dados servida pelo json-server da oficina de reparações e responda com as páginas web do site.  
As páginas web implementadas são as seguintes:

- `página principal` lista de dados consultáveis

- `Listagem das reparações` tabela com data da reparação, nome e NIF do cliente, marca e modelo da viatura e número de intervenções realizadas

- `Listagem dos tipos de intervenção` lista alfabética de código das intervenções - código, nome e descrição

- `Listagem das marcas e modelos dos carros intervencionados` lista alfabética das marcas e modelos dos carros reparados - marca, modelo, número de carros

- `Página da Reparação` página com toda a informação de uma reparação

- `Página do tipo de intervenção` dados da intervenção (código, nome e descrição) e lista de reparações onde foi realizada

## Resultados
O código da solução pode ser encontrado nos seguintes ficheiros:  
[index.js](https://github.com/joaoR21/EngWeb2025/blob/main/TPC1/index.js) - ficheiro com a implementação das páginas web  
[data.js](https://github.com/joaoR21/EngWeb2025/blob/main/TPC1/data.js) - ficheiro que inicializa e popula as estruturas de dados referente às viaturas e intervenções  

## Autor

| Nome  | Número mecanográfico |  
|-------|----------------------|  
| João Ricardo Oliveira Macedo | A104080 | 