const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({

project:{
type:mongoose.Schema.Types.ObjectId,
ref:"Project"
},

amount:Number,
spent:Number,

category:String

},{timestamps:true});

module.exports =
mongoose.models.Budget ||
mongoose.model("Budget",BudgetSchema);