const async = require("hbs/lib/async");
var db = require("../config/database");
var collection = require("../model/collection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
var objectId = require("mongodb").ObjectId;
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      userData.Status = "active";
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (!email) {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            if (data) {
              response.user = userData.Name;
              resolve(response);
            } else {
              resolve();
            }
          });
      } else {
        resolve();
      }
    });
  },
  checkSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (!email) {
        resolve();
      } else {
        resolve(email);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        if (user.Status == "active") {
          bcrypt.compare(userData.Password, user.Password).then((status) => {
            if (status) {
              console.log("login ok");
              response.status = true;
              response.active = true;
              response.Number = user.Number;
              response.Name = user.Name;
              response.user = user;
              resolve(response);
            } else {
              console.log("not ok");
              resolve({ status: false, active: true });
            }
          });
        } else {
          resolve({ active: false });
        }
      } else {
        console.log("Login failed ");
        resolve({ status: false, active: true });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },
  blockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              Status: "",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  unBlockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              Status: "active",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  productView: (id) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(product);
    });
  },
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .deleteOne({ _id: objectId(userId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changePdoductQuantity: (details) => {
    details.count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {
            _id: objectId(details.cart),
            "products.item": objectId(details.product),
          },
          {
            $inc: { "products.$.quantity": details.count },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  removeFromCart: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  getTotalAmount: (uresId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(uresId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0]?.total);
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
        let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
        resolve(cart?.products)
    })
  },
  placeOrderWithNewAddress: (order, products, total, method) => {
    return new Promise((resolve, reject) => {
        console.log(order,products,total);
        let status = order['PaymentMethod'] === 'COD' ? 'placed' : 'pending'
        let orderObj = {
            deliveryDetails: {
                Name: order.Name,
                Mobile: order.PhoneNumber,
                Address: order.Address,
                Pincode: order.Pincode,
                State: order.State,
                City: order.City,
                userId: objectId(order.userId)
            },
            userId: objectId(order.userId),
            PaymentMethode:order.PaymentMethod,
            products: products,
            totalAmount: total,
            status: status,
            Date: new Date()

        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
          db.get().collection(collection.ADDRESS_COLLECTION).insertOne(orderObj.deliveryDetails).then((respons) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
            resolve(response.insrtedId)
          })
        })

    })
},
placeOrder: (order, products, total, method) => {
  return new Promise((resolve, reject) => {
      console.log(order,products,total);
      let status = order['PaymentMethod'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
          deliveryDetails: {
              Name: order.Name,
              Mobile: order.PhoneNumber,
              Address: order.Address,
              Pincode: order.Pincode,
              State: order.State,
              City: order.City,
              userId: objectId(order.userId)
          },
          PaymentMethode:method,
          products: products,
          totalAmount: total,
          status: status,
          Date: new Date()
      }
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
          db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
          resolve(response.insrtedId)
      })

  })
},
getAddressDetails: (userId) => {
  return new Promise(async (resolve, reject) => {
      let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: objectId(userId) }).toArray()
      resolve(address)
  })
},
getUserAddressDetails: (addressId) => {
  return new Promise((resolve, reject) => {
      db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) }).then((address) => {
          resolve(address)
      })
  })
},
getProfile: (userId) => {
  return new Promise(async (resolve, reject) => {
      let profile = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

      resolve(profile)
  })
},

};
