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
          }).then(()=>{
            location.href = "/";
          })
        }
      },
    });
  }
}
