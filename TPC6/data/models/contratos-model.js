const mongoose = require("mongoose");

const contrato_schema = new mongoose.Schema({
    _id:{type:String,required:true},  
    nAnuncio:String,  
    tipoprocedimento:String,
    objectoContrato:String,
    dataPublicacao:String,  
    dataCelebracaoContrato:String,  
    precoContratual:Number,  
    prazoExecucao:String ,  
    NIPC_entidade_comunicante:String,
    entidade_comunicante:String,
    fundamentacao:String 
});

const contrato = mongoose.model("contrato", contrato_schema);

module.exports = contrato;