// alunos_server.js
// EW2024 : 04/03/2024
// by jcr

var http = require('http')
var axios = require('axios')
const { parse } = require('querystring');

var templates = require('./templates')
var st = require('./static.js')            
// aux functions
function collectRequestBodyData(request, callback) {
    if(request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(parse(body));
        });
    }
    else {
        callback(null);
    }
}

// server creation

var alunosServer = http.createServer((req, res) => {
    // logger:what was requested and when it was requested
    var d = new Date().toISOString().substring(0, 16)
    console.log(req.method + " " + req.url + " " + d)

    // handling request
    if(st.staticResource(req)){
        st.serveStaticResource(req, res)
    }

    else{
        switch(req.method){
            case "GET":
                // GET /alunos --------------------------------------------------------------------
                if (req.url === "/" || req.url === "/alunos/"){
                    axios.get("http://localhost:3000/alunos/")
                        .then(resp => {
                            res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
                            var alunos = resp.data;
                            res.write(templates.studentsListPage(alunos,d));
                            res.end();
                        })
                        .catch(err => {
                            console.log(err);
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        });
                }

                // GET /alunos/:id --------------------------------------------------------------------
                else if (req.url.match(/\/alunos\/[A|PG]\d+/)){
                    var ida = req.url.split("/")[2];
                    axios.get("http://localhost:3000/alunos/" + ida)
                    .then(resp => {
                        res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
                        var aluno = resp.data;
                        res.write(templates.studentPage(aluno,d));
                        res.end();
                    })
                    .catch(err => {
                        console.log(err);
                        res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                        res.end();
                    });
                }

                // GET /alunos/registo --------------------------------------------------------------------
                else if (req.url === "/alunos/registo"){
                    res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
                    res.write(templates.studentFormPage(d));
                    res.end();
                }

                // GET /alunos/edit/:id --------------------------------------------------------------------
                else if (req.url.match(/\/alunos\/edit\/(A\d+|PG\d+)/)) {
                    var ida = req.url.split("/")[3];
                    axios.get("http://localhost:3000/alunos/" + ida)
                        .then(resp => {
                            res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
                            var aluno = resp.data;
                            res.write(templates.studentFormEditPage(aluno, d));
                            res.end();
                        })
                        .catch(err => {
                            console.log(err);
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        });
                }

                // GET /alunos/delete/:id --------------------------------------------------------------------

                else if (req.url.match(/\/alunos\/delete\/(A\d+|PG\d+)/)){
                    var ida = req.url.split("/")[3];
                    axios.delete("http://localhost:3000/alunos/" + ida)
                        .then(resp => {
                            res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
                            res.write('<p>registo eliminado.</p>');
                            res.end();
                        })
                        .catch(err => {
                            console.log(err);
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        });
                }

                // GET ? -> Lancar um erro
                else {
                    res.writeHead(404, {'Content-Type':'text/html;charset=UTF-8'});
                    res.end();
                }
                break;

            case "POST":
                // POST /alunos/registo --------------------------------------------------------------------

                if (req.url === "/alunos/registo"){
                    collectRequestBodyData(req, result => {
                        if (result) {
                            axios.post("http://localhost:3000/alunos", result)
                                .then(resp => {
                                    res.writeHead(201, {'Content-Type':'text/html;charset=UTF-8'});
                                    res.write('<p>registo inserido.</p>');
                                    res.write(JSON.stringify(resp.data));
                                    res.end();
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                                    res.end();
                                });
                        } else {
                            console.log("NO BODY DATA");
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        }
                    });
                }

                // POST /alunos/edit/:id --------------------------------------------------------------------

                else if (req.url.match(/\/alunos\/edit\/(A\d+|PG\d+)/)) {
                    collectRequestBodyData(req, result => {
                        if (result) {
                            var ida = req.url.split("/")[3];
                            axios.put(`http://localhost:3000/alunos/${ida}`, result)
                                .then(resp => {
                                    res.writeHead(201,{'Content-Type':'text/html;charset=UTF-8'});
                                    res.write('<p>dados do alunO atualizados.</p>');
                                    res.write(JSON.stringify(resp.data));
                                    res.end();
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                                    res.end();
                                });
                        } else {
                            console.log("NO BODY DATA");
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        }
                    });
                }
                // POST ? -> Lancar um erro
                break;

            case "PUT":
                if (req.url.match(/\/alunos\/edit\/(A\d+|PG\d+)/)) {
                    collectRequestBodyData(req, result => {
                        if (result) {
                            var ida = req.url.split("/")[3];
                            axios.put(`http://localhost:3000/alunos/${ida}`, result)
                                .then(resp => {
                                    res.writeHead(201,{'Content-Type':'text/html;charset=UTF-8'});
                                    res.write('<p>dados do alunO atualizados.</p>');
                                    res.write(JSON.stringify(resp.data));
                                    res.end();
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                                    res.end();
                                });
                        } else {
                            console.log("NO BODY DATA");
                            res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                            res.end();
                        }
                    });
                } else {
                    res.writeHead(404, {'Content-Type':'text/html;charset=UTF-8'});
                    res.write('<p>operação não suportada</p>');
                    res.end();
                }

            default:
                res.writeHead(500, {'Content-Type':'text/html;charset=UTF-8'});
                res.write('<p>método não suportado</p>');
                res.end();
                break;
        }
    }
});

alunosServer.listen(7777, () => {
    console.log("servidor à escuta na porta 7777...")
});

// página inicial com todos os alunos
// página com a informação do aluno (adicionar botões para eliminar e editar)

