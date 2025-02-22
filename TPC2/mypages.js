export function genMainPage(data) {
    return `
    <!DOCTYPE html>
    <html lang="pt">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>escola de música</title>
            <link rel="stylesheet" type="text/css" href="w3.css"/>
        </head>
        <body>
            <header class="w3-container w3-teal">
                <h1><strong>Consulta de dados</strong></h1>
            </header>

                <ul class="w3-ul w3-card">
                    <li><a href="/alunos" class="w3-text-teal">lista de <strong>alunos</strong></a></li>
                    <li><a href="/cursos" class="w3-text-teal">lista de <strong>cursos</strong></a></li>
                    <li><a href="/instrumentos" class="w3-text-teal">lista de <strong>instrumentos</strong></a></li>
                </ul>
            
            <footer class="w3-container w3-teal w3-bottom">
                <p>generated in EngWeb2025 on ${data}</p>
            </footer>
        </body>
    </html>
    `
}

export function genAlunosPage(lalunos,aluno,data) {
    let pagHTML = `
    <!DOCTYPE html>
    <html lang="pt">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>alunos</title>
            <link rel="stylesheet" type="text/css" href="w3.css"/>
        </head>
        <body>
            <header class="w3-container w3-teal">
                <h1><strong>${aluno ? "Detalhes do aluno" : "Lista de alunos"}</strong></h1>
            </header>
            
            ${aluno ? '<a href="/alunos" class="w3-button w3-teal w3-margin">voltar</a>' : '<a href="/" class="w3-button w3-teal w3-margin">voltar</a>'}

            <div class="w3-container">`;

            if (aluno) {
                pagHTML += `
                        <table class="w3-table-all">
                            <tr><th>ID.</th><td>${aluno.id}</td></tr>
                            <tr><th>Nome</th><td>${aluno.nome}</td></tr>
                            <tr><th>Data de Nascimento</th><td>${aluno.dataNasc}</td></tr>
                            <tr><th>Curso</th><td>${aluno.curso}</td></tr>
                            <tr><th>Ano de Curso</th><td>${aluno.anoCurso}</td></tr>
                            <tr><th>Instrumento</th><td>${aluno.instrumento}</td></tr>
                        </table>`;
            } else {
                pagHTML += `
                        <table class="w3-table-all w3-card">
                            <tr class="w3-teal">
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Data de Nascimento</th>
                                <th>Curso</th>
                                <th>Ano de Curso</th>
                                <th>Instrumento</th>
                            </tr>`;

                lalunos.forEach(a => {
                    pagHTML += `
                            <tr>
                                <td><a href="/alunos/${a.id}" class="w3-text-teal">${a.id}</a></td>
                                <td>${a.nome}</td>
                                <td>${a.dataNasc}</td>
                                <td>${a.curso}</td>
                                <td>${a.anoCurso}</td>
                                <td>${a.instrumento}</td>
                            </tr>`;
                });

                pagHTML += `</table>`;
            }

            pagHTML += `
                    </div>
                    <footer class="w3-container w3-teal w3-bottom">
                        <p>generated in EngWeb2025 on ${data}</p>
                    </footer>
                </body>
            </html>`;

    return pagHTML;
}

export function genCursosPage(lcursos,curso,alunos,d) {
    let pagHTML = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>cursos</title>
            <link rel="stylesheet" type="text/css" href="w3.css"/>
        </head>
        <body>
            <header class="w3-container w3-teal">
                <h1><strong>${curso ? `Detalhes do curso - ${curso.designacao}` : 'Lista de cursos'}</strong></h1>
            </header>

            ${curso ? '<a href="/cursos" class="w3-button w3-teal w3-margin">voltar</a>' : '<a href="/" class="w3-button w3-teal w3-margin">voltar</a>'}

            <div class="w3-container">`;

                if (!curso) {
                    pagHTML += `
                            <table class="w3-table-all w3-card">
                                <tr class="w3-teal">
                                    <th>ID.</th>
                                    <th>Designação</th>
                                    <th>Duração</th>
                                    <th>Instrumento</th>
                                </tr>`;

                    lcursos.forEach(c => {
                        pagHTML += `
                                <tr>
                                    <td><a href="/cursos/${c.id}" class="w3-text-teal">${c.id}</a></td>
                                    <td>${c.designacao}</td>
                                    <td>${c.duracao}</td>
                                    <td>${c.instrumento["#text"]}</td>
                                </tr>`;
                    });

                    pagHTML += `</table>`;
                } else {
                    pagHTML += `
                            <table class="w3-table-all">
                            <tr><th>Duração</th><td>${curso.duracao}</td></tr>
                            <tr><th>Instrumento</th><td>${curso.instrumento["#text"]}</td></tr>
                            </table>`;

                    if (alunos && alunos.length > 0) {
                        pagHTML += `
                                <h3><strong>Alunos inscritos.</strong></h3>
                                <table class="w3-table-all w3-card">
                                    <tr class="w3-teal">
                                        <th>ID.</th>
                                        <th>Nome</th>
                                        <th>Data de Nascimento</th>
                                        <th>Ano de Curso</th>
                                        <th>Instrumento</th>
                                    </tr>`;

                        alunos.forEach(aluno => {
                            pagHTML += `
                                    <tr>
                                        <td>${aluno.id}</td>
                                        <td>${aluno.nome}</td>
                                        <td>${aluno.dataNasc}</td>
                                        <td>${aluno.anoCurso}</td>
                                        <td>${aluno.instrumento}</td>
                                    </tr>`;
                        });

                        pagHTML += `</table>`;
                    }
                }

                pagHTML += `
                        </div>
                        <footer class="w3-container w3-teal w3-bottom">
                            <p>generated in EngWeb2025 on ${d}</p>
                        </footer>
                    </body>
                </html>`;

    return pagHTML;
}

export function genInstrumentosPage(linstrumentos,instrumento,alunos,d) {
    let pagHTML = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <title>instrumentos</title>
            <link rel="stylesheet" type="text/css" href="w3.css"/>
        </head>
        <body>
            <header class="w3-container w3-teal">
                <h1><strong>${instrumento ? `Detalhes do instrumento - ${instrumento["#text"]} (${instrumento.id})` : 'Lista de instrumentos'}</strong></h1>
            </header>

            ${instrumento ? '<a href="/instrumentos" class="w3-button w3-teal w3-margin">voltar</a>' : '<a href="/" class="w3-button w3-teal w3-margin">voltar</a>'}

            <div class="w3-container">`;

    if (!instrumento) {
        pagHTML += `
                <table class="w3-table-all w3-card">
                    <tr class="w3-teal">
                        <th>ID</th>
                        <th>Designação</th>
                    </tr>`;

        linstrumentos.forEach(i => {
            pagHTML += `
                    <tr>
                        <td><a href="/instrumentos/${i.id}" class="w3-text-teal">${i.id}</a></td>
                        <td>${i["#text"]}</td>
                    </tr>`;
        });

        pagHTML += `</table>`;
    } else if (alunos && alunos.length > 0) {
        pagHTML += `
                    <h3><strong>Alunos que tocam este instrumento.</strong></h3>
                    <table class="w3-card w3-table-all ">
                        <tr class="w3-teal">
                            <th>ID.</th>
                            <th>Nome</th>
                            <th>Data de Nascimento</th>
                            <th>Curso</th>
                            <th>Ano do Curso</th>
                        </tr>`;

        alunos.forEach(aluno => {
            pagHTML += `
                        <tr>
                            <td>${aluno.id}</td>
                            <td>${aluno.nome}</td>
                            <td>${aluno.dataNasc}</td>
                            <td>${aluno.curso}</td>
                            <td>${aluno.anoCurso}</td>
                        </tr>`;
        });

        pagHTML += `</table>`;
    }

    pagHTML += `
            </div>
            <footer class="w3-container w3-teal w3-bottom">
                <p>generated in EngWeb2025 on ${d}</p>
            </footer>
        </body>
    </html>`;

    return pagHTML;
}