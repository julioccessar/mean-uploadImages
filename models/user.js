var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/fotos", {useNewUrlParser: true, useUnifiedTopology: true});

var posibles_valores = ["M","F", "Otro"];
var email_match = [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "coloca un email valido"];
var password_validation = {
    validator: function(p){
        return this.password_confirmation == p;
    },
    message: "pass no son iguales"
};
var user_schema= new Schema({
    name: String,
    username : {type:String,required:true, maxlength:[50,"el nombre es muy largo"]},
    password: {type:String, minlength:[5,"el pass es corto"], validate:password_validation },
    age: {type:Number, min:[5,"la edad no puede ser menor a 5"], max:[100,"la edad no puede ser mayor a 100"]},
    email: {type: String, required:"El corrreo es obligatorio", match:email_match},
    date_of_birth: Date,
    sex:{type:String, enum:{values: posibles_valores, message:"Opcion no valida"}},
})

user_schema.virtual("password_confirmation").get(function(){
    return this.p_c;
}).set(function(password){
    this.p_c=password;
})

var User = mongoose.model("User", user_schema);

module.exports.User = User;