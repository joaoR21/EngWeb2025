const aluno = require("../models/alunos-model");

// Criar um novo registo
exports.createRecord = (req, res) => {
    const newRecord = new aluno(req.body);
    newRecord.save()
        .then(savedRecord => res.status(201).json(savedRecord))
        .catch(error => res.status(400).json({ message: error.message }));
};

// Obter todos os registos
exports.getAllRecords = (req, res) => {
    aluno.find()
        .then(records => res.status(200).json(records))
        .catch(error => res.status(500).json({ message: error.message }));
};

// Obter um registo por ID
exports.getRecordByID = (req, res) => {
    aluno.findById(req.params.id)
        .then(record => {
            if (!record) return res.status(404).json({ message: "Registo não encontrado" });
            res.status(200).json(record);
        })
        .catch(error => res.status(500).json({ message: error.message }));
};

// Atualizar um registo por ID
exports.updateRecord = (req, res) => {
    aluno.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(updatedRecord => {
            if (!updatedRecord) res.status(404).json({ message: "Registo não encontrado" });
            res.status(200).json(updatedRecord);
        })
        .catch(error => res.status(500).json({ message: error.message }));
};

// Apagar um registo por ID
exports.deleteRecord = (req, res) => {
    aluno.findByIdAndDelete(req.params.id)
        .then(deletedRecord => {
            if (!deletedRecord) res.status(404).json({ message: "Registo não encontrado" });
            res.status(200).json({ message: "Registo excluído com sucesso" });
        })
        .catch(error => res.status(500).json({ message: error.message }));
};
