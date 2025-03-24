const mongoose = require("mongoose");

const aluno_schema = new mongoose.Schema({
    _id: { type:String, required:true },
    nome: { type:String, required:true }, // nome
    gitlink: { type:String, required:true }, // gitlink
    tpcs: { 
        type:Map, 
        of:Number, // TPCs armazenados como pares chave-valor (ex. "tpc1":1)
        default:{} 
    }
});

const aluno = mongoose.model("aluno", aluno_schema);

module.exports = aluno;
