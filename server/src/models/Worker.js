const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({

name:String,

role:String,

phone:String,

project:{
type:mongoose.Schema.Types.ObjectId,
ref:"Project"
}

},{timestamps:true});

module.exports =
mongoose.models.Worker ||
mongoose.model("Worker",WorkerSchema);