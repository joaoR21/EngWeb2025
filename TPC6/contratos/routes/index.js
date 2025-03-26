var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET home page. */
router.get('/', function(req,res) {
  axios.get('http://localhost:16000/contratos')
    .then(resp => {
      res.render('contratos', { lcontr:resp.data, 
        tit:"Lista de contratos"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

router.get("/entidades/:nipc", function(req,res) {
  axios.get(`http://localhost:16000/contratos?NIPC=${req.params.nipc}`)
    .then(resp => {
      const total = resp.data.reduce((sum,contr) => 
        sum + (contr.precoContratual || 0), 0);
        
      res.render('entidade-info', {
        NIPC:req.params.nipc,
        lcontr:resp.data,
        tit:"detalhes de entidade", 
        name:resp.data[0].entidade_comunicante,
        sum:total
      });
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error: err });
    });
});

router.get('/:id', function(req,res) {
  axios.get(`http://localhost:16000/contratos/${req.params.id}`)
    .then(resp => {
      res.render('contrato-info', { contr:resp.data, 
        tit:"detalhes de contrato"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

module.exports = router;
