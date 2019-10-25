module.exports = (req, res, next) => {
  logger.logInfo(req.query, req.body);
  next();
}
