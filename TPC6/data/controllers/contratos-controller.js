const ContratO = require("../models/contratos-model");

// exports.createRecord = (req,res) => {
//     const new_record = new COntrato(req.body);
//     new_record.save()
//         .then(saved_record => res.status(201).json(saved_record))
//         .catch(error => res.status(400).json({ message:error.message }));
// };

exports.get_contratos = () => {
    return ContratO.find().exec();
};

exports.get_entidades = () => {
    return ContratO
            .distinct("entidade_comunicante")
            .sort({entidade_comunicante : 1});
};

exports.get_tipos = () => {
    return ContratO
            .distinct("tipoprocedimento")
            .sort({tipoprocedimento : 1});
};

exports.get_contrato_byID = (id) => {
    return ContratO.findById(id).exec();
};


exports.get_contrato_byentidade = (ent) => {
    return ContratO
        .find({entidade_comunicante : ent})
        .exec();
};

exports.get_contrato_bytipo = (tipo) => {
    return ContratO
        .find({tipoprocedimento : tipo})
        .exec();
};

exports.get_contrato_byNIPC = (nipc) => {
    return ContratO
        .find({NIPC_entidade_comunicante : nipc})
        .exec();
};

exports.insert = (contr) => {
    var contr_save = new ContratO(contr);
    return contr_save.save();
};

exports.update = (contr,id) => {
    return ContratO.findByIdAndUpdate(id,contr, {new : true}).exec();
};

exports.delete = (id) => {
    return ContratO.findByIdAndDelete(id, {new : true}).exec();
};

// exports.getRecordsByTipo = (req,res) => {
//     const tipo = req.query.tipo;
//     if (tipo) {
//         COntrato.find({ tipoprocedimento:tipo })
//             .then(records => res.status(200).json(records))
//             .catch(error => res.status(500).json({ message:error.message }));
//     } else {
//         res.status(400).json({ message:"Tipo não fornecido" });
//     }
// };

// exports.getEntidades = (req, res) => {
//     COntrato.distinct("entidade_comunicante")
//         .then(entities => res.status(200).json(entities.sort()))
//         .catch(error => res.status(500).json({ message:error.message }));
// };

// exports.getTipos = (req,res) => {
//     COntrato.distinct("tipoprocedimento")
//     .then(tipos => res.status(200).json(tipos.sort()))
//     .catch(error => res.status(500).json({ message:error.message }));
// };

// exports.updateRecord = (req,res) => {
//     COntrato.findByIdAndUpdate(req.params.id, req.body, { new:true })
//         .then(updated_record => {
//             if (!updated_record) res.status(404).json({ message:"Registo não encontrado" });
//             res.status(200).json(updated_record);
//         })
//         .catch(error => res.status(500).json({ message:error.message }));
// };

// exports.deleteRecord = (req,res) => {
//     COntrato.findByIdAndDelete(req.params.id)
//         .then(deleted_record => {
//             if (!deleted_record) res.status(404).json({ message:"Registo não encontrado" });
//             res.status(200).json({ message:"Registo excluído com sucesso" });
//         })
//         .catch(error => res.status(500).json({ message:error.message }));
// };