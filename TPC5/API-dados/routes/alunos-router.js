const express = require("express");
const router = express.Router();
const alunosController = require("../controllers/alunos-controller");

router.post("/", alunosController.createRecord);
router.get("/", alunosController.getAllRecords);
router.get("/:id", alunosController.getRecordByID);
router.put("/:id", alunosController.updateRecord);
router.delete("/:id", alunosController.deleteRecord);

module.exports = router;