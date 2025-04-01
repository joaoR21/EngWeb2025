const LIvro = require("../models/model");

exports.get_livros = () => {
    return LIvro.find().exec();
};

exports.get_genres = () => {
    return LIvro.aggregate([
        { $unwind : "$genres" },
        { $group : { _id: "$genres" } },
        { $sort : { _id: 1 } } // sort alphabetically
    ])
    .exec()
    .then(results => results.map(g => g._id)); // retira o campo _id e coloca tudo numa lista
};


exports.get_characters = () => {
    return LIvro.aggregate([
        { $unwind : "$characters" },
        { $group : { _id: "$characters" } },
        { $sort : { _id: 1 } } // sort alphabetically
    ])
    .exec()
    .then(results => results.map(c => c._id));
};

exports.get_book_byID = (id) => {
    return LIvro.findById(id).exec();
};


exports.get_livros_bycharacter = (char) => {
    return LIvro
    .find({ characters: { $in: [char] } })
    .exec();
};

exports.get_livros_bygenre = (g) => {
    return LIvro
    .find({ genres: { $in: [g] } })
    .exec();
};

// exports.get_contrato_byNIPC = (nipc) => {
//     return ContratO
//         .find({NIPC_entidade_comunicante : nipc})
//         .exec();
// };

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