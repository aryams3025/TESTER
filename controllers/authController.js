const bcrypt = require('bcrypt')
const userSchema = require('../model/userModels')
const adminSchema = require('../model/adminSchema')
const flash = require('express-flash');
const verificationController = require('../controllers/verificationController')


module.exports={
    getHome:async(req,res)=>{
            try{
                res.render('shop/home')
            }catch(error){
                console.log(error)
            }
    },
    getUserLogin:async(req,res)=>{
        try{
            res.render('auth/userLogin')
        }catch(error){
            console.log(error)
        }
    },
   
    userLogin: async(req,res)=>{
        try{
            
            userData=await userSchema.findOne({email:req.body.email})
            if(userData && userData.isAdmin!==1){
                if(userData.isBlocked === false){
                    const password=await bcrypt.compare(req.body.password,userData.password)
                    if(password){
                        if(userData.isVerified){
                    
                            req.session.user=userData._id
                            res.redirect('/landing')
                        }else{
                            const newOtp = verificationController.sendEmail(req.body.email, req.body.lastName)
                            await userSchema.updateOne({email : req.body.email},{
                                $set :{ 'token.otp' : newOtp , 'token.generatedTime' : new Date()}
                            })
                            req.session.unVerfiedMail = req.body.email
                            res.redirect( '/otp-verification')
                        }
                    }else{
                        req.flash('err','Incorrect password')
                        res.redirect('/login')
                    }
                }else{
                    const password=await bcrypt.compare(req.body.password,userData.password)
                    if(password){
                        //if user is blocked
                        req.flash('err','blocked user')
                        res.send("User Blocked")
                        res.redirect('/login')
                    }else{
                        //For incorrect password
                        req.flash('err','incorrect Password')
                        res.redirect('/login')
                    }
                }
            }else{
                //incorrect Username
                req.flash('err','Incorrect email')
                res.redirect('/login')
            }
        }catch(err){
           
            console.log(err)
        
        }
    },
    
    
    usersignUp : async(req,res)=>{
        try{
            res.render('auth/userSignup')
        }catch(error){
            console.log(error);
        }
    },
    postuserSignup :  async(req,res)=>{
        try{

            //checking if there any existing user in the site
            const userData = await userSchema.findOne({email:req.body.email})


            //if user exist
            if(userData){
                req.flash('userExist',"User Already Exist..............")
                res.redirect('/signup')
            }
            else{
                const otp = verificationController.sendMail(req.body.email)
                const password = await bcrypt.hash(req.body.password,12)

                const user = new userSchema({
                    firstName : req.body.firstName,
                    lastName : req.body.lastName,
                    email : req.body.email,
                    isAdmin: 0,
                    mobile : req.body.mobile,
                    password : password,
                    token :{
                        otp : otp,
                        generatedTime : new Date()
                    }
                })
                    await user.save()
                    req.session.unVerifiedMail=req.body.email
                    res.redirect('/otp-verification')
            }
        }catch(error){
            console.log(error);
        }
    },

    // otp verification page
    getotpVerification :(req,res)=>{
        res.render('auth/signup-otp')

    },
    //signup verification
    signupVerification : async(req,res)=>{
        try{
            
            const entertime = new Date()
            let {val1,val2,val3,val4,val5,val6} = req.body
            userotp = val1 + val2 + val3 + val4 + val5 + val6
            console.log(userotp);
            //checking otp in database
            const otpCheck = await userSchema.findOne({email : req.session.unVerifiedMail,'token.otp' :userotp})
            
            if(otpCheck){
                //calculating the expire of otp 
                const timeDiff=(new Date(entertime)-otpCheck.token.generatedTime)/1000/60
                
                if(timeDiff <= 1){
                    await userSchema.updateOne({email:otpCheck.email},{$set:{    
                    isVerified : true
                    }})
                }
                req.session.user = otpCheck._id;
                req.session.unVerfiedMail = null
                        req.session.user = otpCheck._id
                        res.redirect('/landing')
                
            }else{
                res.redirect('/otp-verification')
            }

        }catch(error){
            console.log(error);
        }
    },

    //resending otp
    // resendOtp : async(req,res)=>{
    //     try{
    //         let email = req.session.unVerifiedMail
    //         const otp = verificationController.sendMail(email)
    //         await userSchema.updateOne({email:email},{$set:{
    //             token : {
    //                 otp : otp ,
    //                 generatedTime : new Date()
    //             }
    //         }})
    //     }catch(error){
    //         console.log(error);
    //     }
    // },
    // forgotresendOtp : async(req,res)=>{
    //     try{
    //         let email = req.session.unVerifiedMail
    //         const otp = verificationController.sendMail(email)
    //         await userSchema.updateOne({email: email},{$set:{
    //             token :{
    //                 otp : otp,
    //                 generatedTime : new Date()
    //             }
    //         }})
    //     }catch(error){
    //         console.log(error);
    //     }
    // },



    resendOtp: async (req, res) => {
        try {
            let email = req.session.unVerifiedMail;
            const otp = verificationController.sendMail(email);
    
            // Retrieve the current token details from the database
            const user = await userSchema.findOne({ email: email });
            let token = user.token || {};
    
            // Update the OTP and generated time in the token
            token.otp = otp;
            token.generatedTime = new Date();
    
            // Update the user's record with the modified token
            await userSchema.updateOne({ email: email }, { $set: { token: token } });
    
            // Send the OTP via email
            // (Assuming verificationController.sendMail() handles this)
    
            res.status(200).send("OTP resent successfully.");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error.");
        }
    },
    
    forgotresendOtp: async (req, res) => {
        try {
            let email = req.session.unVerifiedMail;
            const otp = verificationController.sendMail(email);
    
            // Retrieve the current token details from the database
            const user = await userSchema.findOne({ email: email });
            let token = user.token || {};
    
            // Update the OTP and generated time in the token
            token.otp = otp;
            token.generatedTime = new Date();
    
            // Update the user's record with the modified token
            await userSchema.updateOne({ email: email }, { $set: { token: token } });
    
            // Send the OTP via email
            // (Assuming verificationController.sendMail() handles this)
    
            res.status(200).send("OTP resent successfully.");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error.");
        }
    },
    
    doUserLogout:(req,res)=>{
        try{
            req.session.user=null
            req.session.productCount=0;
            res.redirect('/login')
        }catch(error){
            res.redirect('/500')
            console.log(error)
        }
    },
    adminsignUp : async(req,res)=>{
        try{
            res.render('auth/adminLogin')
        }catch(error){
            console.log(error);
        }
    },
    postadminlogin : async(req,res)=>{
        try{

            const values = {
                email : "aryams3025@gmail.com",
                password : 1234
            }
            if(req.body.email== values.email && req.body.password == values.password){
                req.session.admin=req.body.email;
                res.render('admin/dashboard')
                
            }else{
                res.send("ERROR : Wrong username and/or password")
            }
        }catch(error){
            console.log(error);
        }
    },
    forgotpassword : async(req,res)=>{
        res.render('auth/forgot-password')
    },
    postforgotpassword : async(req,res)=>{

        try{
            const emailExist = await userSchema.findOne({email:req.body.email})
            if(emailExist){
                const newOtp = verificationController.sendMail(req.body.email,req.body.lastname)
                await userSchema.updateOne(
                    { email: req.body.email },
                    {
                        $set: {
                            'token.otp': newOtp,
                            'token.generatedTime': new Date()
                        }
                    }
                )
                req.session.unVerifiedMail = req.body.email
                res.render('/auth/forgot-password-otp')
            }else{
                res.redirect('/forgot-password')
            }
        }catch(error){
            console.log(error);
        }
        
    }
}