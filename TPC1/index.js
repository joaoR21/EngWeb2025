const http = require('http');
const axios = require('axios');
const data = require('./data');

data.initialize_data();

function generateHTMLHead(title) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    </head>
    <body>
    `;
}

function generateHTMLFooter() {
    return `
    </body>
    </html>
    `;
}

function generateNavBar() {
    return `
    <div class="w3-container w3-teal">
        <h1><strong>Oficina</strong></h1>
    </div>
    <div class="w3-container">
        <p><a href="/reparacoes" class="w3-button w3-teal">reparações</a></p>
        <p><a href="/viaturas" class="w3-button w3-teal">viaturas</a></p>
        <p><a href="/intervencoes" class="w3-button w3-teal">intervenções</a></p>
    </div>
    `;
}

http.createServer((req, res) => {
    console.log('METHOD:' + req.method);
    console.log('URL:' + req.url);

    switch (req.method) {
        case 'GET':
            if (req.url === '/') {
                res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
                res.write(generateHTMLHead('OFICINA'));
                res.write(generateNavBar());
                res.write(generateHTMLFooter());
                res.end();
            } else if (req.url === '/reparacoes') {
                axios.get('http://localhost:3000/reparacoes?_sort=nome')
                    .then(resp => {
                        var reparacoes = resp.data;
                        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
                        res.write(generateHTMLHead('Reparações'));
                        res.write(`
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
                        `);

                        reparacoes.forEach(element => {
                            res.write(`
                                <tr>
                                    <td><a href="/reparacoes/${element.nif}"><strong>${element.nif}</strong></a></td>
                                    <td>${element.nome}</td>
                                    <td>${element.data}</td>
                                    <td>${element.viatura.marca}</td>
                                    <td>${element.viatura.modelo}</td>
                                    <td>${element.nr_intervencoes}</td>
                                </tr>
                            `);
                        });

                        res.write('</table></div>');
                        res.write(generateHTMLFooter());
                        res.end();
                    })
                    .catch(err => {
                        console.error(err);
                        res.writeHead(500, {'Content-Type': 'text/html;charset=utf-8'});
                        res.end();
                    });
            } else if (req.url.match(/^\/reparacoes\/(\d+)$/)) {
                axios.get(`http://localhost:3000/reparacoes?nif=${req.url.match(/^\/reparacoes\/(\d+)$/)[1]}`)
                    .then(resp => {
                        const reparacao = resp.data[0];

                        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
                        res.write(generateHTMLHead('Detalhes da Reparação'));
                        res.write(`
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
                        `);

                        reparacao.intervencoes.forEach(interv => {
                            res.write(`
                                <tr>
                                    <td>${interv.codigo}</td>
                                    <td>${interv.nome}</td>
                                    <td>${interv.descricao}</td>
                                </tr>
                            `);
                        });

                        res.write('</table>');
                        res.write('</div>');
                        res.write(generateHTMLFooter());
                        res.end();
                    })
                    .catch(err => {
                        console.error(err);
                        res.writeHead(500, {'Content-Type': 'text/html;charset=utf-8'});
                        res.end();
                    });
            } else if (req.url === '/viaturas') {
                try {
                    const marcas_sorted = Array.from(data.get_viaturas().entries()).sort();

                    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
                    res.write(generateHTMLHead('Marcas/Modelos'));
                    res.write(`
                        <div class="w3-container w3-teal">
                            <h1><strong>Viaturas</strong></h1>
                        </div>
                        <div class="w3-container">
                            <p><a href="/" class="w3-button w3-teal">voltar</a></p>
                    `);

                    marcas_sorted.forEach(([marca, modelos]) => {
                        res.write(`
                            <h2>${marca}</h2>
                            <table class="w3-table w3-bordered w3-striped">
                                <tr><th>Modelo</th></tr>
                        `);

                        const modelos_sorted = Array.from(modelos).sort();
                        modelos_sorted.forEach(modelo => {
                            res.write(`
                                <tr>
                                    <td>${modelo}</td>
                                </tr>
                            `);
                        });

                        res.write('</table>');
                    });

                    res.write('</div>');
                    res.write(generateHTMLFooter());
                    res.end();
                } catch (err) {
                    console.error(err);
                    res.writeHead(500, {'Content-Type': 'text/html;charset=utf-8'});
                    res.end();
                }
            } else if (req.url === '/intervencoes') {
                try {
                    const intervencoes_sorted = Array.from(data.get_intervencoes().entries()).sort();

                    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                    res.write(generateHTMLHead('Intervenções'));
                    res.write(`
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
                    `);

                    intervencoes_sorted.forEach(([codigo, { nome, descricao }]) => {
                        res.write(`
                            <tr>
                                <td><a href="/intervencoes/${codigo}"><strong>${codigo}</strong></a></td>
                                <td>${nome}</td>
                                <td>${descricao}</td>
                            </tr>
                        `);
                    });

                    res.write('</table>');
                    res.write('</div>');
                    res.write(generateHTMLFooter());
                    res.end();
                } catch (err) {
                    console.error(err);
                    res.writeHead(500, { 'Content-Type': 'text/html;charset=utf-8' });
                    res.end();
                }
            } else if (req.url.match(/^\/intervencoes\/(.+)$/)) {
                const codigo = req.url.match(/^\/intervencoes\/(.+)$/)[1];
                const interv = data.get_intervencoes().get(codigo);

                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                res.write(generateHTMLHead(`Detalhes da Intervenção - ${interv.nome}`)); // Add head
                res.write(`
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
                `);

                interv.reparacoes.forEach(reparacao => {
                    res.write(`
                            <tr>
                                <td>${reparacao.nome}</td>
                                <td>${reparacao.matricula}</td>
                            </tr>
                        `);
                });

                res.write('</table>');
                res.write('</div>');
                res.write(generateHTMLFooter());
                res.end();

            } else {
                res.writeHead(404, { 'Content-Type': 'text/html;charset=utf-8' });
                res.write('<h1>NOT FOUND</h1>');
                res.end();
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/html;charset=utf-8' });
            res.end();
            break;
    }
}).listen(1234);

console.log("server listening on port 1234");
