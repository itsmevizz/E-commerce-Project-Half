var express = require("express");
const { response, render } = require("../app");
var router = express.Router();
var userHelpers = require("../helpers/user-helpers");
var config = require("../config/otp");
const { route } = require("./admin");
const productHelper = require("../helpers/products.helpers");
const { getAllCategory } = require("../helpers/products.helpers");
const async = require("hbs/lib/async");
const { getTotalAmount } = require("../helpers/user-helpers");
var client = require("twilio")(config.accountSID, config.authToken);
var verifyLogin =require('../middleware/verifySession')
/* GET home page. */
router.get("/", async function (req, res, next) {
  var user = req.session.user;
  let cartCount = 0;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let category = await productHelper.getAllCategory();
  productHelper.getAllProducts().then((products) => {
    res.render("user/home", {
      title: "Sparklein",
      products,
      user,
      category,
      cartCount,
    });
  });
});

router.get("/product-view", async (req, res) => {
  var user = req.secure.user;
  id = req.query.id;
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  cartCount = await userHelpers.getCartCount(req.session.user?._id);
  userHelpers.productView(id).then((product) => {
    var products = product;
    console.log(products);
    res.render("user/product-view", { products, user, cartCount, totalAmt });
  });
});

router.get("/user-login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    loginErr = req.flash.loginErr;
    console.log("\n !@#!#!");
    res.render("user/user-login", { login: true, loginErr });
    req.flash.loginErr = false;
  }
});
router.get("/user-signUp", (req, res) => {
  res.render("user/user-signUp", { login: true, failed: req.flash.failed });
  req.flash.failed = false;
});

router.post("/user-login", (req, res) => {
  if (!req.session.user) {
    console.log("hi");
    if (req.body.Email && req.body.Password) {
      userHelpers.doLogin(req.body).then((response) => {
        if (response.active) {
          if (response.status) {
            var Number = response.Number;
            var Name = response.Name;
            // console.log(Name);
            // client.verify
            // .services(config.serviceSID)
            // .verifications
            // .create({
            //   to:`+91${Number}`,
            //   channel:'sms'
            // })
            // .then((data)=>{
            // res.render('user/otp',{Number, Name})
            // })
            // res.redirect("/");
            req.session.user = response.user;
            console.log(response + "/*/*/*/");
            console.log(JSON.stringify(response));
            res.redirect("/");
          } else {
            req.flash.loginErr = "Invallid Email or Password";
            res.redirect("/user-login");
          }
        } else {
          req.flash.loginErr = "Admin is blocked you";
          res.redirect("/user-login");
        }
      });
    } else if (req.body.Email == "" && req.body.Password == "") {
      req.flash.loginErr = "Email and Password Must Not be Empty";
      res.redirect("/user-login");
    } else {
      req.flash.loginErr = "Invallid Email or Password";
      res.redirect("/user-login");
    }
  } else {
    redirect("/");
  }
});

router.post("/user-signUp", (req, res) => {
  req.flash.Number = req.body.Number;
  userHelpers.doSignup(req.body).then((response) => {
    if (response) {
      req.flash.success =
        "Your account has been activated successfully. You can now login.";
      res.render("user/user-login", { success: req.flash.success });
    } else {
      req.flash.failed = "Email Already Exists";
      res.redirect("/user-signUp");
    }
  });
});

router.get("/otp", (req, res) => {
  res.render("user/otp");
});

router.post("/otp-varify", (req, res) => {
  var Number = req.query.Number;
  var Name = req.query.Name;
  console.log(Number);
  var otp = req.body.Number;
  var out = otp.join("");
  console.log(otp);
  console.log(out);
  client.verify
    .services(config.serviceSID)
    .verificationChecks.create({
      to: `+91${Number}`,
      code: out,
    })
    .then((data) => {
      console.log(data.status + "otp status/*/*/*/");
      if (data.status == "approved") {
        req.session.user = Name;
        console.log(Name + "/*/*namemememe");
        res.redirect("/");
      } else {
        console.log(data.status + "no booyy");
        otpErr = "Invalid OTP";
        res.render("user/otp", { otpErr, Number });
      }
    });
});
router.post("/otp-resend", (req, res) => {
  var Number = req.query.Number;
  console.log(Number);
  client.verify
    .services(config.serviceSID)
    .verifications.create({
      to: `+91${Number}`,
      channel: "sms",
    })
    .then((data) => {
      console.log(JSON.stringify(data));
    });
});
router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/");
});

router.get("/category", (req, res) => {
  res.render("user/category");
});

router.get("/cart", async (req, res) => {
  var user = req.session.user;

  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  cartCount = await userHelpers.getCartCount(req.session.user?._id);
  userHelpers.getCartProducts(req.session.user?._id).then((products) => {
    res.render("user/cart", { products, user, cartCount, totalAmt });
  });
  userHelpers.getCartProducts(req.session.user?._id).then((products) => {
    res.render("user/cart", { products, user, cartCount });
  });
});

router.get("/add-to-cart/:id",async (req, res) => {
  if (req.session.user) {
    count = await userHelpers.getCartCount(req.session.user?._id);
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true, count });
      console.log(count+'/*/*/*/');
    });
  } else {
    res.json({ status: false });
  }
});

router.post("/change-product-quantity", (req, res, next) => {
  console.log("1 Hi quantity");
  userHelpers.changePdoductQuantity(req.body).then(async (response) => {
    let totalAmt = await userHelpers.getTotalAmount(req.body.user);
    res.json({ status: true, totalAmt });
    console.log(req.body);
  });
});

router.post("/remove-from-cart", (req, res) => {
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response);
    console.log("\n 0011");
  });
});


router.get('/payment',verifyLogin,async(req,res)=>{
  let address=await userHelpers.getAddressDetails(req.session.user?._id)
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  res.render('user/payment',{totalAmt, user:req.session.user,address}
  )
})

router.post('/payment',verifyLogin,async(req,res)=>{
  console.log(req.query.payment);
  let products= await userHelpers.getCartProductList(req.session.user?._id)
  let user=await userHelpers.getProfile(req.session.user?._id)
  console.log(user);
  let address= await userHelpers.getUserAddressDetails(req.query.addressId,req.session.user._id)
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  userHelpers.placeOrder(address,products,totalAmt,req.query.payment).then((orderId)=>{
    if(req.query.payment==='COD'){
      res.json({ codSuccess: true })
    }
  })
})

router.get('/addNewAddress',verifyLogin,async(req,res)=>{
  let totalAmt = await userHelpers.getTotalAmount(req.session.user?._id)
  res.render('user/Add-address', { totalAmt, user: req.session.user }) 
})

router.post('/addNewAddress',async(req,res)=>{
  let products = await userHelpers.getCartProductList(req.body?.userId)
  let totalAmt = await userHelpers.getTotalAmount(req.body?.userId)
  userHelpers.placeOrderWithNewAddress(req.body, products, totalAmt).then(()=>{
    res.render('user/Add-address', { totalAmt, user: req.session.user })
  })
  
})


module.exports = router;
