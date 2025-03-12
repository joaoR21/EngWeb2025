var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { 
    title:'Engenharia Web 2025',
    docente:'jcr',
    instituicao:'DI-UM'
  });
});

/* GET list of films */
router.get('/filmes', function(req, res) {
  axios.get('http://localhost:3000/filmes')
    .then(resp => {
      res.render('filmes', { lfilmes:resp.data, 
        tit:"Lista de filmes"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

router.get('/filmes/actor/:name', function(req, res) {
  const actor = req.params.name;
  axios.get(`http://localhost:3000/filmes?cast_like=${actor}`)
    .then(resp => {
      res.render('actor-films', { 
        lfilmes:resp.data,
        tit:`Filmes em que ${actor} participa`,
        actor:actor
      });
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

/* GET edit film form */
router.get('/filmes/edit/:id', function(req, res) {
  axios.get(`http://localhost:3000/filmes/${req.params.id}`)
    .then(resp => {
      if (resp.data) {
        res.render('filmes-edit', { filme:resp.data });
      } else {
        res.render('error', { error:"Filme não encontrado" });
      }
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

/* POST edit film (update film details) */
router.post('/filmes/edit/:id', function(req, res) {
  let updated_film = {
    title:req.body.title,
    year:req.body.year,
    cast:Array.isArray(req.body.cast) ? req.body.cast : req.body.cast.split(',').map(a => a.trim()),
    genres:Array.isArray(req.body.genres) ? req.body.genres : req.body.genres.split(',').map(g => g.trim())
  };

  axios.put(`http://localhost:3000/filmes/${req.params.id}`, updated_film)
    .then(() => {
      res.redirect('/filmes');
    })
    .catch(err => {
      console.log(err);
      res.render('error', {error:err});
    });
});

router.get('/filmes/delete/:id', function(req, res) {
  axios.delete(`http://localhost:3000/filmes/${req.params.id}`)
    .then(() => {
      res.redirect('/filmes');
    })
    .catch(err => {
      console.log(err);
      res.render('error', {error:err});
    });
});

module.exports = router;