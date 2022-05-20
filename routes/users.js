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
var verifyLogin = require("../middleware/verifySession");
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AXGObqtYcejaOhJKp3Ek_YeVUbneEopHvSuraohas7YwCNPtA90TnWJ6UEC7Vuerl-lcU206rGOJUTWY",
  client_secret:
    "EF4Vy1gkb7uyWyC9VLN81XwgeHtgpU7fwRcnpVTkAYiUgSQuHyiTygJvRZcdk_y6pipWVxoaUUoLqX3h",
});

/* GET home page. */
router.get("/", async function (req, res, next) {
  var user = req.session.user;
  var name = req.flash.Name;
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
      name,
    });
  });
});

router.get("/product-view", async (req, res) => {
  var user = req.session.user;
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
            req.flash.Name = Name;
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
      if (data.status == "approved") {
        req.session.user = Name;
        res.redirect("/");
      } else {
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
  var name = req.flash.Name;
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  cartCount = await userHelpers.getCartCount(req.session.user?._id);
  userHelpers.getCartProducts(req.session.user?._id).then((products) => {
    res.render("user/cart", { products, user, cartCount, totalAmt, name });
  });
  userHelpers.getCartProducts(req.session.user?._id).then((products) => {
    res.render("user/cart", { products, user, cartCount, name });
  });
});

router.get("/add-to-cart/:id", async (req, res) => {
  if (req.session.user) {
    count = await userHelpers.getCartCount(req.session.user?._id);
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true, count });
      console.log(count + "/*/*/*/");
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

router.get("/payment", verifyLogin, async (req, res) => {
  var name = req.flash.Name;
  let address = await userHelpers.getAddressDetails(req.session.user?._id);
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  if(!totalAmt){
    res.redirect('/')
  }res.render("user/payment", { totalAmt, user: req.session.user, name, address });
});

router.post("/payment", verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProductList(req.session.user?._id);
  let address = await userHelpers.getUserAddressDetails(req.query.addressId,req.session.user?._id);
  totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  req.flash.totalAmt = totalAmt
  userHelpers.placeOrder(address, products, totalAmt, req.query.payment).then((orderId) => {
    req.flash.orderId = orderId
    if (req.query.payment === "COD") {
      res.json({ codSuccess: true});
    }else if(req.query.payment === 'ONLINE'){
      totalPrice=totalAmt*100
      userHelpers.generateRazorpay(orderId, totalPrice).then((response)=>{
        console.log('\n line 232');
        response.user = req.session?.user
        res.json({razorpaySuccess:true})
      })
    }else{
      var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3005/success",
            "cancel_url": "http://localhost:3005/payment"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "item",
                    "sku": "001",
                    "price": totalAmt,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": totalAmt
            },
            "description": "This is the payment description."
        }]
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
        res.json(payment)
      }
  });      
    }
  });
});

// Paypal Success
router.get('/success',(req,res)=>{
  var totalAmt = req.flash.totalAmt
  var orderId = req.flash.orderId 
  const payerId = req.query.PayerID
  const paymentId = req.query.paymentId
  
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": totalAmt
        }
    }]
  }
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
      userHelpers.changePaymentStatus(orderId).then(()=>{
        console.log('\n Hi success')
        res.render('user/successPay')
      })
    }
});
})

//Razorpay verification
router.post('/verify-payment',(req,res)=>{
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:'payment failed'})
  })
})

router.get("/addNewAddress", verifyLogin, async (req, res) => {
  let totalAmt = await userHelpers.getTotalAmount(req.session.user?._id);
  res.render("user/Add-address", { totalAmt, user: req.session.user });
});

router.post("/addNewAddress", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body?.userId);
  let totalAmt = await userHelpers.getTotalAmount(req.body?.userId);
  userHelpers
    .placeOrderWithNewAddress(req.body, products, totalAmt)
    .then(() => {
      res.render("user/Add-address", { totalAmt, user: req.session.user });
    });
});

router.get("/order-list", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.userOrders(req.session.user?._id);
  console.log(orders);
  res.render("user/order-history", { user, orders });
});

router.get("/user-profile", verifyLogin, async (req, res) => {
  let success = req.flash.success
  let failed = req.flash.failed
  let user = req.session.user;
  var name = req.flash.Name;
  let address = await userHelpers.getAddressDetails(req.session.user?._id);
  let profile = await userHelpers.getProfile(req.session.user?._id);
  res.render("user/user-profile", { profile, user, name, address, success, failed });
});

router.get("/edit-profileAddress", verifyLogin, async (req, res) => {
  let user = req.session.user;
  var name = req.flash.Name;
  var addressId = req.query.id
  let address = await userHelpers.getUserAddressDetails(req.query.id);
  res.render("user/edit-address", { user, name, address, addressId });
});


router.post("/editAddress", async (req, res) => {

  userHelpers.editAddress(req.body).then((respons) => {
    console.log(respons);
    res.json({ updated: true })
  });
});

router.post('/change-userProfile', (req, res) => {
  // var user= req.body.userId
  userHelpers.changeuserProfile(req.body).then((response) => {
    if (response) {
      res.json({ updated: true })
      // req.flash.success =
      //   "Password changed successfully";
      // // res.redirect("/user-profile"); 
    } else {
      res.json({ updated: false })
    }
  });
})



router.post('/change-userPassword', (req, res) => {
  var user = req.body.userId
  userHelpers.changePassword(req.body, user).then((response) => {
    if (response) {
      res.json({ updated: true })
    } else {
      res.json({ updated: false })
    }
  });
})


router.post("/cancel-order", (req, res) => {
  // console.log(req.body.orderId, 'jjkkklll');
  userHelpers.cancelOrder(req.body).then((response) => {
    if (response) {
      res.json(response);
    } else res.json({ status: true });
  });
});



module.exports = router;
