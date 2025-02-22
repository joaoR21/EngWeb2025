# TPC2

Pretende-se construir um serviço em nodejs, que consuma a API de dados servida pelo json-server da escola de música e responda com as páginas web do site.  
As páginas web implementadas são as seguintes:

- `página principal` lista de dados consultáveis

- `Listagem dos alunos` tabela com ID., nome, data de nascimento, curso que frequenta, ano que está inscrito e instrumento que toca

- `Listagem dos cursos` tabela com ID., designação, tempo de duração em anos e instrumento

- `Listagem dos instrumentos` listagem dos instrumentos com ID. e designação

- `Página do aluno` página com toda a informação de um aluno

- `Página do curso` dados do curso (duração e instrumento) e lista dos alunos que o frequentam

- `Página do instrumento` lista com os alunos que tocam o instrumento

## Resultados
O código da solução pode ser encontrado nos seguintes ficheiros:  
[server.js](https://github.com/joaoR21/EngWeb2025/blob/main/TPC2/server.js) - ficheiro com a implementação da lógica do servidor web, incluindo o fetching dos dados a partir do json-server  
[mypages.js](https://github.com/joaoR21/EngWeb2025/blob/main/TPC2/mypages.js) - ficheiro com a implementação das páginas web em html

## Autor

| Nome  | Número mecanográfico |  
|-------|----------------------|  
| João Ricardo Oliveira Macedo | A104080 | 