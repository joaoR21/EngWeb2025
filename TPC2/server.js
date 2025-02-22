import { createServer } from 'http'
import axios from 'axios';
import { genMainPage,genAlunosPage,genCursosPage,genInstrumentosPage } from './mypages.js'
import { readFile } from 'fs'

createServer(function (req, res) {
    const d = new Date().toISOString().substring(0, 16);
    console.log(req.method + " " + req.url + " " + d)

    if(req.url === '/'){
        res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'})
        res.write(genMainPage(d))
        res.end()  
    }
    else if(req.url === '/alunos'){
        axios.get('http://localhost:3000/alunos')
            .then(function(resp){
                const alunos = resp.data;
                res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'})
                res.write(genAlunosPage(alunos,null,d))
                res.end()
            })
            .catch(erro => {
                console.log("[ERROR]:" + erro)
                res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
            })
    }
    else if (req.url.match(/^\/alunos\/A\d+$/)) {
        const aluno_ID = req.url.split("/")[2]
        axios.get(`http://localhost:3000/alunos/${aluno_ID}`)
            .then(function(resp) {
                const aluno = resp.data;
                res.writeHead(200, { 'Content-Type':'text/html;charset=utf-8' });
                res.write(genAlunosPage(null,aluno,d));
                res.end();
            })
            .catch(erro => {
                console.log("[ERROR]:" + erro)
                res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
            })
    }    
    else if(req.url === '/cursos'){
        axios.get('http://localhost:3000/cursos')
            .then(function(resp){
                const cursos = resp.data;
                res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'})
                res.write(genCursosPage(cursos,null,null,d))
                res.end()
            })
            .catch(erro => {
                console.log("[ERROR]:" + erro)
                res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
            })
    }
    else if (req.url.match(/^\/cursos\/\w+$/)) {
        const curso_ID = req.url.split("/")[2];

        axios.get(`http://localhost:3000/cursos/${curso_ID}`)
            .then(curso_resp => {
                const curso = curso_resp.data;

                axios.get(`http://localhost:3000/alunos?curso=${curso_ID}`)
                    .then(alunos_resp => {
                        const alunos = alunos_resp.data;
    
                        res.writeHead(200, { 'Content-Type':'text/html;charset=utf-8' });
                        res.write(genCursosPage(null,curso,alunos,d));
                        res.end();
                    })
                    .catch(erro => {
                        console.log("[ERROR]:" + erro)
                        res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                        res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
                    })
            })
            .catch(erro => {
                console.log("[ERROR] ao encontrar curso..." + erro);
                res.writeHead(404, { 'Content-Type':'text/html;charset=utf-8' });
                res.end(`<p>404 - não encontrado.</p>`);
            });
    }

    else if(req.url === '/instrumentos'){
        axios.get('http://localhost:3000/instrumentos')
            .then(function(resp){
                const insts = resp.data;
                res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'})
                res.write(genInstrumentosPage(insts,null,null,d))
                res.end()
            })
            .catch(erro => {
                console.log("[ERROR]:" + erro)
                res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
            })
    }
    else if (req.url.match(/^\/instrumentos\/I\d+$/)) {
        const inst_ID = req.url.split("/")[2];

        axios.get(`http://localhost:3000/instrumentos/${inst_ID}`)
            .then(instrumento_resp => {
                const instrumento = instrumento_resp.data;
                const inst_name = instrumento["#text"];

                axios.get(`http://localhost:3000/alunos?instrumento=${inst_name}`)
                    .then(alunos_resp => {
                        const alunos = alunos_resp.data;

                        res.writeHead(200, { 'Content-Type':'text/html;charset=utf-8' });
                        res.write(genInstrumentosPage(null,instrumento,alunos,d));
                        res.end();
                    })
                    .catch(erro => {
                        console.log("[ERROR]:" + erro)
                        res.writeHead(500, {'Content-Type':'text/html;charset=utf-8'})
                        res.end('<p>500 - Ocorreu um erro ao obter os dados.</p>')
                    })
            })
            .catch(erro => {
                console.log("[ERROR] ao encontrar instrumetento..." + erro);
                res.writeHead(404, { 'Content-Type':'text/html;charset=utf-8' });
                res.end(`<p>404 - não encontrado.</p>`);
            });
    }
    else if(req.url.match(/w3\.css$/)){
        readFile("w3.css", function(erro, dados){
            if(erro){
                res.writeHead(404, { 'Content-Type':'text/html;charset=utf-8' });
                res.end(`<p>404 - w3.css não encontrado.</p>`);
            }
            else{
                res.writeHead(200, {'Content-Type':'text/css'})
                res.end(dados)
            }
        })
    }
    else{
        res.writeHead(404, { 'Content-Type':'text/html;charset=utf-8' });
        res.end(`<p>404 - não encontrado.</p>`);
    }
}).listen(3017)

console.log('Server listening on port 3017...')

