const axios = require('axios');

let viaturas_map = new Map();
let intervencoes_map = new Map();

function initialize_viaturas() {
    return axios.get('http://localhost:3000/reparacoes')
        .then(response => {
            response.data.forEach(reparacao => {
                const { marca, modelo } = reparacao.viatura;

                if (!viaturas_map.has(marca)) {
                    viaturas_map.set(marca, new Set());
                }
                viaturas_map.get(marca).add(modelo);
            });

            console.log('Viaturas inicializadas.');
        })
        .catch(error => {
            console.error('ocorreu um erro ao inicializar as intervenções.\n', error);
        });
}

function initialize_intervencoes() {
    return axios.get('http://localhost:3000/reparacoes')
        .then(response => {
            response.data.forEach(reparacao => {
                reparacao.intervencoes.forEach(interv => {
                    if (!intervencoes_map.has(interv.codigo)) {
                        intervencoes_map.set(interv.codigo, {
                            nome: interv.nome,
                            descricao: interv.descricao,
                            reparacoes: []
                        });
                    }

                    intervencoes_map.get(interv.codigo).reparacoes.push({
                        nome:reparacao.nome,
                        matricula: reparacao.viatura.matricula,
                    });
                });
            });

            console.log('intervenções inicializadas.');
        })
        .catch(error => {
            console.error('ocorreu um erro ao inicializar as intervenções.\n', error);
        });
}

exports.get_viaturas = () => viaturas_map;
exports.get_intervencoes = () => intervencoes_map;

exports.initialize_data = () => {
    initialize_viaturas()
        .then(() => initialize_intervencoes())
        .then(() => {
            console.log('Viaturas e intervenções inicializadas.');
        })
        .catch(error => {
            console.error('ocorreu um erro ao inicializar os dados.\n', error);
        });
}