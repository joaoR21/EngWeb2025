const http = require('http');
const axios = require('axios');
const data = require('./data');

data.initialize_data();

function generate_HTML(title,content) {
    return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>${title}</title>
        <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    </head>
    <body>
        ${content}
    </body>
    </html>
    `;
}

http.createServer((req, res) => {
    console.log('METHOD:' + req.method);
    console.log('URL:' + req.url);

    switch (req.method) {
        case 'GET':
            if (req.url === '/') {
                const main_page = `
                    <div class="w3-container w3-teal">
                        <h1><strong>Oficina</strong></h1>
                    </div>
                    <div class="w3-container">
                        <p><a href="/reparacoes" class="w3-button w3-teal">reparações</a></p>
                        <p><a href="/viaturas" class="w3-button w3-teal">viaturas</a></p>
                        <p><a href="/intervencoes" class="w3-button w3-teal">intervenções</a></p>
                    </div>
                    `;
                res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                res.write(generate_HTML('oficina', main_page));
                res.end();
            } else if (req.url === '/reparacoes') {
                axios.get('http://localhost:3000/reparacoes?_sort=nome')
                    .then(resp => {
                        var reparacoes = resp.data;
                        const content = `
                            <div class="w3-container w3-teal">
                                <h1><strong>Reparações</strong></h1>
                            </div>
                            <div class="w3-container">
                                <p><a href="/" class="w3-button w3-teal">voltar</a></p>
                                <table class="w3-table w3-bordered w3-striped">
                                    <tr>
                                        <th>NIF</th>
                                        <th>Nome</th>
                                        <th>Data</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th># Intervenções</th>
                                    </tr>
                                    ${reparacoes.map(element => `
                                        <tr>
                                            <td><a href="/reparacoes/${element.nif}"><strong>${element.nif}</strong></a></td>
                                            <td>${element.nome}</td>
                                            <td>${element.data}</td>
                                            <td>${element.viatura.marca}</td>
                                            <td>${element.viatura.modelo}</td>
                                            <td>${element.nr_intervencoes}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>`;

                        res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                        res.write(generate_HTML('reparações', content));
                        res.end();
                    })
                    .catch(err => {
                        console.error(err);
                        res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'});
                        res.end();
                    });
            } else if (req.url.match(/^\/reparacoes\/(\d+)$/)) {
                axios.get(`http://localhost:3000/reparacoes?nif=${req.url.match(/^\/reparacoes\/(\d+)$/)[1]}`)
                    .then(resp => {
                        const reparacao = resp.data[0];
                        const content = `
                            <div class="w3-container w3-teal">
                                <h1>detalhes da reparação - ${reparacao.nif}</h1>
                            </div>
                            <div class="w3-container">
                                <p><a href="/reparacoes" class="w3-button w3-teal">voltar</a></p>
                                <p><strong>NIF:</strong> ${reparacao.nif}</p>
                                <p><strong>Data:</strong> ${reparacao.data}</p>
                                <p><strong>Marca:</strong> ${reparacao.viatura.marca}</p>
                                <p><strong>Modelo:</strong> ${reparacao.viatura.modelo}</p>
                                <p><strong># Intervenções:</strong> ${reparacao.nr_intervencoes}</p>
                                <h2>Intervenções</h2>
                                <table class="w3-table w3-bordered w3-striped">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nome</th>
                                        <th>Descrição</th>
                                    </tr>
                                    ${reparacao.intervencoes.map(interv => `
                                        <tr>
                                            <td>${interv.codigo}</td>
                                            <td>${interv.nome}</td>
                                            <td>${interv.descricao}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>`;

                        res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                        res.write(generate_HTML('detalhes', content));
                        res.end();
                    })
                    .catch(err => {
                        console.error(err);
                        res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'});
                        res.end();
                    });
            } else if (req.url === '/viaturas') {
                try {
                    const viaturas = data.get_viaturas();
                    const sortedEntries = Array.from(viaturas.entries()).sort();

                    const content = `
                        <div class="w3-container w3-teal">
                            <h1><strong>Viaturas</strong></h1>
                        </div>
                        <div class="w3-container">
                            <p><a href="/" class="w3-button w3-teal">voltar</a></p>
                            ${sortedEntries.map(([marca, info]) => `
                                <h4><strong>${marca}</strong> (${info.count} veículos)</span></h4>
                                <table class="w3-table w3-bordered w3-striped">
                                    <tr><th>Modelo</th></tr>
                                    ${Array.from(info.models).sort().map(modelo => `
                                        <tr>
                                            <td>${modelo}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            `).join('')}
                        </div>`;

                    res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                    res.write(generate_HTML('Viaturas', content));
                    res.end();
                } catch (err) {
                    console.error(err);
                    res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'});
                    res.end();
                }
            } else if (req.url === '/intervencoes') {
                try {
                    const intervencoes_sorted = Array.from(data.get_intervencoes().entries()).sort();
                    const content = `
                        <div class="w3-container w3-teal">
                            <h1><strong>Intervenções</strong></h1>
                        </div>
                        <div class="w3-container">
                            <p><a href="/" class="w3-button w3-teal">voltar</a></p>
                            <table class="w3-table w3-bordered w3-striped">
                                <tr>
                                    <th>Código</th>
                                    <th>Nome</th>
                                    <th>Descrição</th>
                                </tr>
                                ${intervencoes_sorted.map(([codigo,{ nome,descricao }]) => `
                                    <tr>
                                        <td><a href="/intervencoes/${codigo}"><strong>${codigo}</strong></a></td>
                                        <td>${nome}</td>
                                        <td>${descricao}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>`;

                    res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                    res.write(generate_HTML('intervenções', content));
                    res.end();
                } catch (err) {
                    console.error(err);
                    res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'});
                    res.end();
                }
            } else if (req.url.match(/^\/intervencoes\/(.+)$/)) {
                const codigo = req.url.match(/^\/intervencoes\/(.+)$/)[1];
                const interv = data.get_intervencoes().get(codigo);
                const content = `
                    <div class="w3-container w3-teal">
                        <h1>detalhes da intervenção - ${codigo}</h1>
                    </div>
                    <div class="w3-container">
                        <p><a href="/intervencoes" class="w3-button w3-teal">voltar</a></p>
                        <p><strong>Nome:</strong> ${interv.nome}</p>
                        <p><strong>Descrição:</strong> ${interv.descricao}</p>

                        <h2>Reparações</h2>
                        <table class="w3-table w3-bordered w3-striped">
                            <tr><th>Nome</th><th>Matrícula</th></tr>
                            ${interv.reparacoes.map(reparacao => `
                                <tr>
                                    <td>${reparacao.nome}</td>
                                    <td>${reparacao.matricula}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>`;

                res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
                res.write(generate_HTML(`detalhes da intervenção - ${interv.nome}`, content));
                res.end();
            } else {
                res.writeHead(404, {'Content-Type':'text/html;charset=utf-8'});
                res.write('<h1>NOT FOUND</h1>');
                res.end();
            }
            break;

        default:
            res.writeHead(405, {'Content-Type':'text/html;charset=utf-8'});
            res.end();
            break;
    }
}).listen(1234);

console.log("server listening on port 1234");