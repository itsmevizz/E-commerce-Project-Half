function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#carrt-count").html();
        count = parseInt(count) + 1;
        $("#carrt-count").html(count);
      } else {
        window.location.href = "/user-login";
      }
    },
  });
}

function changeQuantity(cartId, ProId, userId, count) {
  let quantity = parseInt(document.getElementById(ProId).innerHTML);
  $.ajax({
    url: "/change-product-quantity",
    data: {
      user: userId,
      cart: cartId,
      product: ProId,
      count: count,
    },
    method: "post",
    success: (response) => {
      if (response) {
        // if(quantity+count <= 1){
        //   $('#lesss').hide()
        // }else{
        //   $('#lesss').show()
        // }
        document.getElementById(ProId).innerHTML = quantity + count;
        document.getElementById("totalAmt").innerHTML = response.totalAmt;
        document.getElementById("totalAll").innerHTML = response.totalAmt;
      }
    },
  });
}
function removeItem(cartId, ProId) {
  Swal.fire({
    title: "Are you sure?",
    text: "",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/remove-from-cart",
        data: {
          cart: cartId,
          product: ProId,
        },
        method: "post",
        success: (response) => {
          if (response.removeProduct) {
            Swal.fire(
              "Deleted!",
              "Your product has been deleted.",
              "success"
            ).then((result) => {
              if (result.isConfirmed) {
                location.reload();
              }
            });
          }
        },
      });
    }
  });
}
// address
$("#checkout-form").submit((e) => {
  console.log(e);
  e.preventDefault();
  if (validateForm(true)) {
    $.ajax({
      url: "/addNewAddress",
      method: "post",
      data: $("#checkout-form").serialize(),
      success: (response) => {
        if (response.codSuccess) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Order Placed",
            showConfirmButton: false,
            timer: 2500,
          });
          location.href = "/";
        }
      },
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Please give the required",
    });
  }
});
// place order
var checkoutAddressId;
var PaymentMethod;

function selectAddress(id) {
  checkoutAddressId = id;
}
function selectPayment(payment) {
  PaymentMethod = payment;
}

function placeOrder() {
  if (!checkoutAddressId && PaymentMethod) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Please Select address to Place Order",
    });
  } else if (!PaymentMethod && checkoutAddressId) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Please Select payment method to Place Order",
    });
  }
  if (!checkoutAddressId && !PaymentMethod) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Please give address and payment method",
    });
  } else {
    $.ajax({
      url: `/payment?payment=${PaymentMethod}&addressId=${checkoutAddressId}`,
      method: "post",
      success: (res) => {
        if (res.codSuccess) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Order Placed",
            showConfirmButton: false,
            timer: 2500,
          }).then(() => {
            location.href = "/";
          });
        } else if (res.razorpaySuccess) {
          razorpayPayment(res);
        } else {
          payPalPayment(res);
        }
      },
    });
  }
}

// razorpay

function razorpayPayment(order) {
  var options = {
    key: "rzp_test_BMQyq5KAzN3eqy", // Enter the Key ID generated from the Dashboard
    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Sparklein",
    description: "Test Transaction",
    image: "",
    order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      varifyPayment(response, order);
    },
    prefill: {
      name: order.user.Name,
      email: order.user.Email,
      contact: order.user.Number,
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#3399cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}
function varifyPayment(payment, order) {
  $.ajax({
    url: "/verify-payment",
    data: {
      payment,
      order,
    },
    method: "post",
    success: (response) => {
      if (response.status) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Order Placed",
          showConfirmButton: false,
          timer: 2500,
        }).then(() => {
          location.href = "/";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Payment Failed, Select another payment method",
        }).then(() => {
          location.href = "/payment";
        });
      }
    },
  });
}

// PayPalPayment

function payPalPayment(payment) {
  for (let i = 0; i < payment.links.length; i++) {
    if (payment.links[i].rel === "approval_url") {
      location.href=(payment.links[i].href)
    }
  }
}
// Payment success
function paypalSuccess(){
  console.log('Hi success');
  location.href = "/";
}


// Edit address
$("#editAddress-form").submit((e) => {
  console.log(e);
  e.preventDefault();
  if (validateForm(true)) {
    $.ajax({
      url: "/editAddress",
      method: "post",
      data: $("#editAddress-form").serialize(),
      success: (response) => {
        if (response.updated) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Updated successfully",
            showConfirmButton: false,
            timer: 2500,
          }).then(() => {
            location.href = "/user-profile";
          });
        }
      },
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Please give the required",
    });
  }
});

// edit profile
$("#editProfile-form").submit((e) => {
  console.log(e);
  e.preventDefault();
  if (validateProfile(true)) {
    $.ajax({
      url: "/change-userProfile",
      method: "post",
      data: $("#editProfile-form").serialize(),
      success: (response) => {
        if (response.updated) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Edited successfully",
            showConfirmButton: false,
            timer: 2500,
          }).then(() => {
            location.href = "/user-profile";
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Somthing wrong please try later",
          });
        }
      },
    });
  }
});

// change password
$("#changePassword-form").submit((e) => {
  console.log(e);
  e.preventDefault();
  if (changePassword(true)) {
    $.ajax({
      url: "/change-userPassword",
      method: "post",
      data: $("#changePassword-form").serialize(),
      success: (response) => {
        if (response.updated) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Passwoer changed successfully",
            showConfirmButton: false,
            timer: 2500,
          }).then(() => {
            location.href = "/user-profile";
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Password incorrect",
          });
        }
      },
    });
  }
});

function cancelOrder(orderId) {
  Swal.fire({
    title: "Are you sure?",
    text: "",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/cancel-order",
        data: {
          orderId: orderId,
        },
        method: "post",
        success: (response) => {
          if (response) {
            Swal.fire(
              "Deleted!",
              "Your order has been canceled .",
              "success"
            ).then((result) => {
              if (result.isConfirmed) {
                location.reload();
              }
            });
          }
        },
      });
    }
  });
}

function deliveryStatus(value, orderId) {
  Swal.fire({
    title: "Are you sure want to Change the Order status",
    text: "",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/admin/deleveryStatusUpdate",
        data: {
          status: value,
          orderId: orderId,
        },
        method: "post",
        success: (response) => {
          if (response) {
            Swal.fire("success", "Status Updated .", "success");
          }
        },
      });
    }
  });
}

