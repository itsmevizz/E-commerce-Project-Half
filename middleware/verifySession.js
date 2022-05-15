const verifylogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/user-login");
  }
};

module.exports = verifylogin;
