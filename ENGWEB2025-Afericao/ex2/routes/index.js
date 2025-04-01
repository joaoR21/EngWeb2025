var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET home page. */
router.get('/', function(req,res) {
  axios.get('http://localhost:17000/books')
    .then(resp => {
      res.render('books', { lbooks:resp.data, 
        tit:"Lista de livros"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

router.get('/:id', function(req,res) {
  axios.get(`http://localhost:17000/books/${req.params.id}`)
    .then(resp => {
      res.render('books-info', { book:resp.data, 
        tit:"detalhes do livro"});
    })
    .catch(err => {
      console.log(err);
      res.render('error', { error:err });
    });
});

module.exports = router;
