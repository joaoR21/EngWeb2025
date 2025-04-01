const express = require("express");
const router = express.Router();
const controller = require("../controllers/controller");

router.get("/", function(req,res,next) {
    if (req.query.charater) {
        controller.get_livros_bycharacter(req.query.charater)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    } else if (req.query.genre) {
        controller.get_livros_bygenre(req.query.genre)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    } else {
        controller.get_livros()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    }
    
});

router.get("/genres", function(req,res,next) {
    controller.get_genres()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.get("/characters", function(req,res,next) {
    controller.get_characters()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.get("/:id", function(req,res,next) {
    controller.get_book_byID(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.post("/", function(req,res,next) {
    controller.insert(req.body)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.put("/:id", function(req,res,next) {
    controller.update(req.body,req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.delete("/:id", function(req,res,next) {
    controller.delete(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

module.exports = router;