module.exports = (req, res, next) => {
  req.checkBody('origin_place.address', 'Origin Place Address is not empty').notEmpty();
  req.checkBody('origin_place.geometry', 'Origin Place Geometry is not empty').notEmpty();
  req.checkBody('destination_places[0].address', 'Destination Places Address is not empty').notEmpty();
  req.checkBody('destination_places[0].geometry', 'Destination Places Geometry is not empty').notEmpty();
  req.checkBody('phone', 'phone is not empty').notEmpty();
  req.checkBody('deposit', 'Deposit is interger').isInt();
  req.checkBody('salary', 'Salary is interger').isInt();

  let errors = req.validationErrors();

  if (errors) {
      return res.json({
          code : 400,
          error : util.inspect(errors),
      });
  } else {
    next();
  }
}
