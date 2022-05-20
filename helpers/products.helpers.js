var collection = require("../model/collection");
var db = require("../config/database");
const async = require("hbs/lib/async");
var objectId = require("mongodb").ObjectId;
module.exports = {
  addProduct: (product, files, resolve) => {
    let Img = files.map((info, index) => {
      console.log(JSON.stringify(info));
      return files[index].filename;
    });
    console.log("##########");
    product.img = Img;
    product.Price = parseInt(product.Price);
    product.Stock = parseInt(product.Stock);
    db.get()
      .collection("product")
      .insertOne(product)
      .then(() => {
        resolve();
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  addCategory: (category, file) => {
    return new Promise(async (resolve, reject) => {
      let Img = file.filename;
      category.img = Img;
      db.get()
        .collection("category")
        .insertOne(category)
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  updateProduct: (productId, proDetails) => {
    console.log(proDetails.Name);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: proDetails.Name,
              Description: proDetails.Description,
              Price: proDetails.Price,
              Category: proDetails.Category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  getAllorders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },
  statusUpdate: (status, orderId) => {
    return new Promise((resolve, reject) => {
      if (status == "Delevered") {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { id: objectId(orderId) },
            {
              $set: {
                status: status,
                Cancelled: false,
                Delivered: true,
              },
            }
          );
      } else if (status == "Cancelled") {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: status,
                Cancelled: true,
                Delivered: false,
              },
            }
          );
      } else {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: status,
              },
            }
          )
          .then((response) => {
            resolve(true);
          });
      }
    });
  },
};
