
const { request } = require('express');
const express = require('express');
const cors =require("cors");
require('./db/config');
const User =require('./db/User');
const Product = require('./db/Products');
const Jwt =require('jsonwebtoken');
const jwtKey= 'e-comm';

const res = require('express/lib/response');



const app = express();
app.use(express.json());
app.use (cors());

app.post("/register", async (req, resp)=>{
    let user =new User(req.body);
    let result= await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err, token)=>{
        if(err){
            resp.send({result:"Something went wrong, Please try after sometime"})
        }
        resp.send({result, auth:token});
    })
})

app.post("/login",async (req,resp)=>{
    if(req.body.password && req.body.email){
    let user = await User.findOne(req.body).select("-password");
    if(user){
        Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err, token)=>{
            if(err){
                resp.send({result:"Something went wrong, Please try after sometime"})
            }
            resp.send({user, auth:token});
        })
    }
    else{
        resp.send({result:"No user found"});
    }
}
else{
    resp.send({result:"No user found"});
}
    
})



app.post("/add-product",varifyToken,async (req,resp)=>{
let product = new Product(req.body);
let result= await product.save();
resp.send(result);
})

app.get("/products",varifyToken, async (req, resp)=>{
    let products= await Product.find();
    if(products.length>0){
        resp.send(products);
    }
    else{
        resp.send({result:"No products found"});
    }
})

app.delete("/product/:id",varifyToken, async(req,resp)=>{
    
    const result= await Product.deleteOne({_id:req.params.id});
    resp.send(result);

});

app.get("/product/:id",varifyToken,async (req,resp)=>{
    try{ let result = await Product.findOne({_id:req.params.id});
    if(result){
        resp.send(result);
    }
    else{
        throw("No record found");
        resp.send({result:"No record found"});
    
    }}
    catch(e){
        resp.send({result:"no record found"});
        // res.status(404).send({result:"Oh uh, something went wrong"});
    }

})

app.put("/product/:id",varifyToken, async (req, resp)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {
         $set : req.body
        }
        )
        resp.send(result);
})

app.get('/search/:key',varifyToken, async(req, resp)=>{
    let result = await Product.find({
        "$or" :[
            {name:{ $regex:req.params.key}},
            {company:{ $regex:req.params.key}},
            {category:{ $regex:req.params.key}},
            {price:{ $regex:req.params.key}}
        ]

    });
    resp.send(result);
})

function varifyToken(req, resp, next){
    let token = req.headers['authorization'];
    if(token){
        token=token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, valid)=>{
            if(err){
                resp.status(401).send({result:"Please provide valid token."})

            }
            else{
                next();
            }
        })
    }
    else{
        resp.status(403).send({result:"Please add token with header"})

    }
    // console.log("middleware called", token);

}
app.listen(5000);

