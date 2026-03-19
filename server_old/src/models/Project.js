const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

location:String,

budget:Number,

status:{
type:String,
enum:["planning","active","completed"],
default:"planning"
},

startDate:Date,
endDate:Date

},{timestamps:true});

module.exports =
mongoose.models.Project ||
mongoose.model("Project",ProjectSchema);