const express = require("express");
const router = express.Router();
const contratos_controller = require("../controllers/contratos-controller");

// router.post("/", contratos_controller.createRecord);
router.get("/", function(req,res,next) {
    if (req.query.entidade) {
        contratos_controller.get_contrato_byentidade(req.query.entidade)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    } else if (req.query.tipo) {
        contratos_controller.get_contrato_bytipo(req.query.tipo)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    } else if (req.query.NIPC) { // este fui em que fiz
        contratos_controller.get_contrato_byNIPC(req.query.NIPC)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    } else {
        contratos_controller.get_contratos()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
    }
    
});

router.get("/entidades", function(req,res,next) {
    contratos_controller.get_entidades()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.get("/tipos", function(req,res,next) {
    contratos_controller.get_tipos()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.get("/:id", function(req,res,next) {
    contratos_controller.get_contrato_byID(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.post("/", function(req,res,next) {
    contratos_controller.insert(req.body)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.put("/:id", function(req,res,next) {
    contratos_controller.update(req.body,req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

router.delete("/:id", function(req,res,next) {
    contratos_controller.delete(req.params.id)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json(err))
});

// router.get("/entidades", contratos_controller.getEntidades);
// router.get("/tipos", contratos_controller.getTipos);
// router.get("/", contratos_controller.getRecordsByEntidade);
// router.get("/", contratos_controller.getRecordsByTipo);
// router.put("/:id", contratos_controller.updateRecord);
// router.delete("/:id", contratos_controller.deleteRecord);

module.exports = router;