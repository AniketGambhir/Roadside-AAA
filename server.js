require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SECRET = process.env.JWT_SECRET || "development-secret-change-me";
const useMongo = Boolean(process.env.MONGODB_URI);
let memory = { users: [], vehicles: [], requests: [] };
let User, Vehicle, ServiceRequest;
if (useMongo) {
  mongoose.connect(process.env.MONGODB_URI).then(() => console.log("MongoDB connected")).catch(e => console.error("MongoDB connection:", e.message));
  const userSchema = new mongoose.Schema({ name:String, email:{type:String,unique:true}, password:String, phone:String, role:{type:String,default:"customer"}, verified:{type:Boolean,default:false}, services:[String], price:Number, rating:{type:Number,default:5}, lat:Number, lng:Number }, {timestamps:true});
  const vehicleSchema = new mongoose.Schema({ userId:String, make:String, model:String, plate:String, year:String }, {timestamps:true});
  const requestSchema = new mongoose.Schema({ userId:String, customerName:String, phone:String, vehicle:String, service:String, description:String, address:String, lat:Number, lng:Number, mechanicId:String, mechanicName:String, mechanicPhone:String, status:{type:String,default:"Pending"}, price:Number, createdAt:{type:Date,default:Date.now}, updatedAt:{type:Date,default:Date.now} });
  User = mongoose.model("User", userSchema); Vehicle = mongoose.model("Vehicle", vehicleSchema); ServiceRequest = mongoose.model("ServiceRequest", requestSchema);
}
const all = async (kind) => useMongo ? ({users:User,vehicles:Vehicle,requests:ServiceRequest}[kind]).find().lean() : memory[kind];
const save = async (kind, doc) => useMongo ? new ({users:User,vehicles:Vehicle,requests:ServiceRequest}[kind])(doc).save() : (memory[kind].push({...doc,_id:require("crypto").randomUUID()}), memory[kind][memory[kind].length-1]);
const update = async (kind,id,patch) => {
  if(useMongo) return ({users:User,vehicles:Vehicle,requests:ServiceRequest}[kind]).findByIdAndUpdate(id,patch,{new:true}).lean();
  const item=memory[kind].find(x=>x._id===id); if(item) Object.assign(item,patch); return item;
};
const distKm = (a,b,c,d) => { if([a,b,c,d].some(v=>typeof v!=="number")) return null; const r=x=>x*Math.PI/180, x=r(c-a),y=r(d-b),h=Math.sin(x/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(y/2)**2; return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)); };
const tokenFor = u => jwt.sign({id:String(u._id),role:u.role,name:u.name,email:u.email},SECRET,{expiresIn:"7d"});
const auth = async (req,res,next) => { try { const t=(req.headers.authorization||"").replace(/^Bearer /,""); const p=jwt.verify(t,SECRET); const users=await all("users"); req.user=users.find(x=>String(x._id)===p.id); if(!req.user) return res.status(401).json({error:"Account not found"}); next(); } catch { res.status(401).json({error:"Please sign in again"}); } };
const role = (...roles) => (req,res,next) => roles.includes(req.user.role) ? next() : res.status(403).json({error:"Not permitted for this account"});
app.get("/api/health",(req,res)=>res.json({ok:true,app:"Roadside AAA",database:useMongo?"MongoDB":"temporary in-memory"}));

app.post("/api/auth/register",async(req,res)=>{try{
 const {name,email,password,phone,role:requestedRole}=req.body; if(!name||!email||!password||password.length<6) return res.status(400).json({error:"Enter name, email and a password of at least 6 characters"});
 const users=await all("users"); if(users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({error:"Email already registered"});
 const roleName=requestedRole==="mechanic"?"mechanic":"customer";
 const u=await save("users",{name,email:email.toLowerCase(),password:await bcrypt.hash(password,10),phone:phone||"",role:roleName,verified:false,services:[],price:0,rating:5});
 res.json({token:tokenFor(u),user:{id:String(u._id),name:u.name,email:u.email,role:u.role,verified:u.verified}});
}catch(e){res.status(500).json({error:"Could not create account"});}});
app.post("/api/auth/login",async(req,res)=>{const {email,password}=req.body; const users=await all("users"); const u=users.find(x=>x.email===String(email||"").toLowerCase()); if(!u||!await bcrypt.compare(password||"",u.password)) return res.status(401).json({error:"Incorrect email or password"}); res.json({token:tokenFor(u),user:{id:String(u._id),name:u.name,email:u.email,role:u.role,verified:u.verified}});});
app.get("/api/me",auth,(req,res)=>res.json({id:String(req.user._id),name:req.user.name,email:req.user.email,phone:req.user.phone,role:req.user.role,verified:req.user.verified}));

app.post("/api/vehicles",auth,role("customer"),async(req,res)=>{const {make,model,plate,year}=req.body;if(!make||!model||!plate)return res.status(400).json({error:"Make, model and registration number are required"});const v=await save("vehicles",{userId:String(req.user._id),make,model,plate:plate.toUpperCase(),year:year||""});res.json(v);});
app.get("/api/vehicles",auth,async(req,res)=>res.json((await all("vehicles")).filter(v=>v.userId===String(req.user._id))));

app.get("/api/mechanics",async(req,res)=>{const users=(await all("users")).filter(u=>u.role==="mechanic"&&u.verified);const lat=Number(req.query.lat),lng=Number(req.query.lng);res.json(users.map(u=>({...u,password:undefined,distance:distKm(lat,lng,u.lat,u.lng)})).sort((a,b)=>(a.distance??99999)-(b.distance??99999)));});
app.post("/api/mechanic/profile",auth,role("mechanic"),async(req,res)=>{const {services,price,lat,lng}=req.body;const patch={services:Array.isArray(services)?services:[],price:Number(price)||0,lat:Number.isFinite(Number(lat))?Number(lat):undefined,lng:Number.isFinite(Number(lng))?Number(lng):undefined};const u=await update("users",String(req.user._id),patch);res.json({ok:true,verified:u.verified});});
app.get("/api/requests",auth,async(req,res)=>{const list=await all("requests");let result=list;if(req.user.role==="customer")result=list.filter(x=>x.userId===String(req.user._id));if(req.user.role==="mechanic")result=list.filter(x=>!x.mechanicId||x.mechanicId===String(req.user._id));res.json(result.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));});
app.post("/api/requests",auth,role("customer"),async(req,res)=>{const {vehicle,service,description,address,lat,lng}=req.body;if(!service||!address)return res.status(400).json({error:"Choose a service and enter your location"});const r=await save("requests",{userId:String(req.user._id),customerName:req.user.name,phone:req.user.phone||"",vehicle:vehicle||"Not specified",service,description:description||"",address,lat:Number(lat)||undefined,lng:Number(lng)||undefined,status:"Pending",createdAt:new Date(),updatedAt:new Date()});res.json(r);});
app.patch("/api/requests/:id/accept",auth,role("mechanic"),async(req,res)=>{if(!req.user.verified)return res.status(403).json({error:"Your mechanic account is awaiting admin verification"});const requests=await all("requests");const r=requests.find(x=>String(x._id)===req.params.id);if(!r||r.mechanicId)return res.status(404).json({error:"Request is no longer available"});const u=await update("requests",req.params.id,{mechanicId:String(req.user._id),mechanicName:req.user.name,mechanicPhone:req.user.phone||"",status:"Accepted",updatedAt:new Date()});res.json(u);});
app.patch("/api/requests/:id/status",auth,async(req,res)=>{const requests=await all("requests");const r=requests.find(x=>String(x._id)===req.params.id);if(!r)return res.status(404).json({error:"Request not found"});if(req.user.role!=="admin"&&r.mechanicId!==String(req.user._id))return res.status(403).json({error:"Only the assigned mechanic or admin can update this job"});const allowed=["On the way","Arrived","In progress","Completed","Cancelled"];if(!allowed.includes(req.body.status))return res.status(400).json({error:"Invalid status"});res.json(await update("requests",req.params.id,{status:req.body.status,updatedAt:new Date()}));});

app.get("/api/admin/overview",auth,role("admin"),async(req,res)=>{const [users,requests]=await Promise.all([all("users"),all("requests")]);res.json({users:users.length,mechanics:users.filter(u=>u.role==="mechanic").length,pendingPartners:users.filter(u=>u.role==="mechanic"&&!u.verified).length,active:requests.filter(r=>!["Completed","Cancelled"].includes(r.status)).length,requests:requests.length});});
app.get("/api/admin/users",auth,role("admin"),async(req,res)=>res.json((await all("users")).map(({password,...u})=>u)));
app.patch("/api/admin/users/:id/verify",auth,role("admin"),async(req,res)=>{const u=await update("users",req.params.id,{verified:Boolean(req.body.verified)});if(!u)return res.status(404).json({error:"User not found"});res.json({ok:true});});
app.get("/api/admin/requests",auth,role("admin"),async(req,res)=>res.json((await all("requests")).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))));
app.get("/api/*",(req,res)=>res.status(404).json({error:"API route not found"}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const port=process.env.PORT||3000;
app.listen(port,()=>console.log("Roadside AAA listening on "+port));
