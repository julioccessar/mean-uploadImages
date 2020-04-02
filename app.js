var express = require('express');
var bodyParser = require("body-parser");
var User = require("./models/user").User;
//var cookieSession = require("cookie-session");

var router_app = require("./routes_app");
var sessions_middleware = require("./middlewares/sessions");
//const formidableMiddleware = require('express-formidable');
const formidableMiddleware = require("express-form-data");

var methodOverride = require("method-override");

var http = require("http");
var realtime = require("./realtime");

const redis = require('redis')
const session = require('express-session')
var RedisStore = require('connect-redis')(session)

var redisClient = redis.createClient({
 /* host: 'localhost',
  port: 6123,
  password: 'my secret',
  db: 1,*/
})
redisClient.unref()
redisClient.on('error', console.log)
//var store = new RedisStore({ client: redisClient })


var app = express();
var server = http.Server(app);

var sessionMiddleware= session({
    store: new RedisStore({ client: redisClient }),
    secret:"super secret word"
})

realtime(server, sessionMiddleware);

app.use("/public", express.static("public"));
app.use(express.static("assets"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'jade');

app.use(methodOverride("_method"));

/*app.use(cookieSession({
    name:"session",
    keys:["llave-1","llave-2"]
}));*/


app.use(sessionMiddleware);
//app.use(formidable());

app.use(formidableMiddleware.parse({ keepExtensions: true}));

app.get("/", function(req, res){
    console.log(req.session.user_id);
    res.render('index');    
})

app.get("/signup", function(req, res){  
    User.find(function(err,doc){
        console.log(doc);
        res.render('signup');
    })      
})

app.get("/login", function(req, res){
    res.render('login');         
})

app.post("/users", function(req, res){    
    console.log("user:" + req.body.email);
    console.log("pass:" + req.body.password);
    console.log("password_confirmation:" + req.body.password_confirmation);
    var user = new User({email:req.body.email, 
                         password: req.body.password,
                         password_confirmation: req.body.password_confirmation,
                         username: req.body.username});

    /*user.save(function(err){
        if(err){
            console.log(String(err));
        }
        res.send('guardamos tus datos');
    })*/

    user.save().then(function(us){
        res.send('guardamos tus datos');
    },function(err){
        if(err){
            console.log(String(err));
            res.send('NO pudimos guardar tus datos');
        } 
    })

    
})

app.post("/sessions", function(req, res){  
    User.findOne({email:req.body.email, password:req.body.password}, function(err,user){
        req.session.user_id=user._id;
        res.redirect("/app");
    })      
})

app.use("/app", sessions_middleware);
app.use("/app", router_app);
//app.listen(8080); // WARNING: app.listen(80) will NOT work here! socket.io
server.listen(8080);// socket.io