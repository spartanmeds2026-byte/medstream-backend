export const cors = async (req, res, next) => {
  var allowedDomains = ['http://localhost:5173','https://demov3.s9-cloud.com', 'https://poshpetservices.s9-cloud.com'];
  var origin = req.headers.origin;
  if(allowedDomains.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
}
