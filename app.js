const express = require('express');
const session = require('express-session')
const nocache = require('nocache')
const flash = require('express-flash');
const path = require('path')
require('./config/database')()
require('dotenv').config()
const mongoose = require('mongoose')



//getting routers from the router folder
const adminrouter=require('./routers/adminRouter')
const shopRouter = require('./routers/shopRouter')
const authrouter=require('./routers/authRouter')
const moment=require('moment')



const app = express();
app.use(express.json())
app.use(express.urlencoded({extended : false}))

app.set('view engine','ejs')
app.set('views','views')


app.use(flash());
app.use(express.static(path.join(__dirname,'public')));
app.use(session({
    resave:false,
    secret:process.env.KEY,
    saveUninitialized:false
}))
const shortDateFormat ='MMM Do YY'

app.locals.moment=moment;
app.locals.shortDateFormat=shortDateFormat;


app.use(authrouter);
app.use('/admin',adminrouter);
app.use('/', shopRouter);




const PORT=process.env.PORT||3001;
app.listen(PORT,()=>{
    console.log(`Server connected.. at http://localhost:${PORT}/`)
})