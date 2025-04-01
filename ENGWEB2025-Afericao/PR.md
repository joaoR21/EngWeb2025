# Aferição

## descrição

Foi desenvolvida uma aplicação que permite consultar os dados relativos a um conjunto de livros.

## persistência de dados

A persistência dos dados foi realizada utilizando o **MONGODB**, em execução num docker container.  
Apenas existe uma coleção na base de dados -- `livros`.

## setup da base de dados

Foi utilizado um ficheiro em formato `.json`, no qual foi necessário proceder às seguintes alterações:

- conversão de listas em formato de string para um formato nativo de lista
- campo `bookID` renomeado para `_id`

Também, por motivos de *performance*, o trabalho foi realizado recorrendo a uma versão do dataset reduzida para 10% do tamanho original.

Os seguintes comandos foram executados para inicializar a base de dados:
```bash
docker cp db.json mongoEW:/tmp
docker exec -it mongoEW mongoimport -d livros -c livros --file tmp/db.json --jsonArray
```

## respostas textuais
[queries](https://github.com/joaoR21/EngWeb2025/blob/main/ENGWEB2025-Afericao/ex1/queries.txt)

## instruções de como executar as aplicações desenvolvidas
Num terminal, executar:
```bash
cd ex1
npm i
npm start
```
Irá ser aberta uma conexão na porta **17000**.

Noutro terminal, executar:
```bash
cd exw
npm i
npm start
```
Irá ser aberta a aplicação web na porta **17001**.
