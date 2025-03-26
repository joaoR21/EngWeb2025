# TPC6

Pretende-se desenvolver uma app para visualizar os contratos públicos celebrados em Portugal no ano de 2024, implementando dois serviços recorrendo ao express - `data` e `contratos`

As páginas da aplicação web são as seguintes:  

- `página principal` tabela com os contratos e alguma informação relevante.

- `página de detalhes do contrato` toda a informação acerca de um dado contrato.

- `página da entidade` listagem dos contratos celebrados por uma determinada entidade, bem como o respetivo valor do somatório dos preços contratuais dos contratos.

## Resultados
O código da solução pode ser encontrado em:  
[data](https://github.com/joaoR21/EngWeb2025/blob/main/TPC6/data) - aplicação em nodejs que recebe pedidos REST, interage com o `mongo-DB` para obter os dados e responde em .json  
[contratos](https://github.com/joaoR21/EngWeb2025/blob/main/TPC6/contratos) - aplicação em nodejs que responde com uma interface web (templates .pug) a pedidos do utilizador (sempre que precisar de dados pede-os à API de dados).

## Autor

| Nome  | Número mecanográfico |  
|-------|----------------------|  
| João Ricardo Oliveira Macedo | A104080 | 