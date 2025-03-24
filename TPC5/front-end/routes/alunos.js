var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET home page. */
router.get('/alunos', function(req,res) {
  axios.get('http://localhost:5000/data/alunos')
    .then(resp => {
      res.render('alunos', { lalunos:resp.data, 
        tit:"Lista de alunos"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

/* GET edit alunos form */
router.get('/alunos/edit/:id', function(req,res) {
  axios.get(`http://localhost:5000/data/alunos/${req.params.id}`)
    .then(resp => {
      if (resp.data) {
        res.render('alunos-form', { a:resp.data });
      } else {
        res.render('error', { error:"aluno não encontrado" });
      }
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

router.post('/alunos/edit/:id', function(req, res) {
  let updated_aluno = {
    _id : req.body._id,
    nome : req.body.nome,
    gitlink : req.body.gitlink,
    tpcs : Array.from({ length: 8 }, (_, i) => `tpc${i + 1}`)
      .reduce((acc, tpc) => {
        if (req.body[tpc]) {
          acc[tpc] = 1;
        }
        return acc;
      }, {})
  };

  axios.put(`http://localhost:5000/data/alunos/${req.params.id}`, updated_aluno)
    .then(() => {
      res.redirect('/alunos');
    })
    .catch(err => {
      console.error(err);
      res.render('error', { error: err });
    });
});

router.get('/alunos/delete/:id', function(req,res) {
  axios.delete(`http://localhost:5000/data/alunos/${req.params.id}`)
    .then(() => {
      res.redirect('/alunos');
    })
    .catch(err => {
      console.log(err);
      res.render('error', {error:err});
    });
});

module.exports = router;
