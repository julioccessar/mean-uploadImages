var express = require('express');
var Imagen = require("./models/imagenes");
var router = express.Router();
var fs = require("fs");
var redis = require("redis");

var client = redis.createClient();

var image_finder_middleware = require("./middlewares/find_image");

router.get("/", function(req, res){  
    Imagen.find({})
    .populate("creator")  
    .exec(function(err,imagenes){
        if(err) console.log(err)
        res.render('app/home', {imagenes:imagenes});  
    })    
})

/* REST */
router.get("/imagenes/new", function(req, res){    
    res.render("app/imagenes/new");    
})

router.all("/imagenes/:id*", image_finder_middleware);

router.get("/imagenes/:id/edit", function(req, res){   
    res.render("app/imagenes/edit") 
    /*Imagen.findById(req.params.id,function(err, imagen){
        if(!err){
            console.log(imagen);
            res.render("app/imagenes/edit", {imagen:imagen})
        } else {
            res.render(err);
        }            
    })*/     
})

router.route("/imagenes/:id")
    .get(function(req,res){
        //client.publish("images", res.locals.imagen.toString());
        res.render("app/imagenes/show")
        /*Imagen.findById(req.params.id,function(err, imagen){
            if(!err){
                console.log(imagen);
                res.render("app/imagenes/show", {imagen:imagen})
            } else {
                res.render(err);
            }            
        }) */       
    })
    .put(function(req,res){
        res.locals.imagen.title = req.body.title;
        console.log("edit " + req.body.title);
        res.locals.imagen.save(function(err){
            if(!err){               
                res.render("app/imagenes/show"); //, {imagen:imagen}
            } else {
                res.render("app/imagenes/"+req.params.id+"/edit");//, {imagen:imagen}
            }
        }) 
        /*Imagen.findById(req.params.id,function(err, imagen){
            imagen.title = req.body.title;
            imagen.save(function(err){
                if(!err){
                    res.render("app/imagenes/show", {imagen:imagen})
                } else {
                    res.render("app/imagenes/"+imagen.id+"/edit", {imagen:imagen})
                }
            })                    
        })*/
    })
    .delete(function(req,res){
        console.log("delete " + req.params.id);
        Imagen.findByIdAndRemove({_id:req.params.id}, function(err){
            
            if(!err){
                res.redirect("/app/imagenes");
            } else {
                console.log(err);
                res.redirect("/app/imagenes/" + req.params.id);
            }
        })
    })
router.route("/imagenes")
    .get(function(req,res){
        Imagen.find({creator:res.locals.user._id},function(err, imagenes){    
        //Imagen.find({},function(err, imagenes){          
            if(err){res.redirect("/app"); return;}
            res.render("app/imagenes/index", {imagenes:imagenes});
        })
    })
    .post(function(req,res){
        console.log(req.files.archivo.name);
        console.log(req.files.archivo.path);
        var extension = req.files.archivo.name.split(".").pop();
        //console.log(extension);
        var data={
            title : req.body.title,
            creator: res.locals.user._id,
            extension: extension,
        }
        var imagen = new Imagen(data);
        imagen.save(function(err){
            if(!err){
                var imgJSON={
                    id: imagen._id,
                    title: imagen.title,
                    extension: imagen.extension,
                }
                client.publish("images", JSON.stringify(imgJSON));
                //fs.rename(req.files.archivo.path, "public/imagenes/" + imagen._id + "." + extension);
                fs.rename(req.files.archivo.path, "public/imagenes/" + imagen._id + "." + extension, (err) => {
                    if (err) throw err;
                    
                    res.redirect("/app/imagenes/" + imagen._id);
                });
                
            } else {
                res.render(err);
            }
        })
    })
       
module.exports = router;