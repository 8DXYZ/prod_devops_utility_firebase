require('dotenv').config();
const  authenticateJWT  = require('./lib/authMiddlewear');
const { createServer, loadAPIs} = require('@8DXYZ/restful-server');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const apiMetaDemoServiceGroup1= require('./apis/apiMetaDemoServiceGroup1');
const apiMetaDemoServiceGroup2= require('./apis/apiMetaDemoServiceGroup2');
const default404= "Unable to find the requested resource!"
const port = process.env.PORT?process.env.PORT:3000
const app = createServer();

app.use(authenticateJWT);




console.log( apiMetaDemoServiceGroup1.serviceContext);
loadAPIs(app,
    apiMetaDemoServiceGroup1,
    apiMetaDemoServiceGroup1.serviceContext,
    apiMetaDemoServiceGroup1.serviceVersion);
loadAPIs(app,
    apiMetaDemoServiceGroup2,
    apiMetaDemoServiceGroup2.serviceContext,
    apiMetaDemoServiceGroup2.serviceVersion);
  

//app.use(rateLimit);
//default set the port to listen
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//if requests are not handle 
app.use(({ res }) => {
        const message = default404;
        res.status(404).json({ message });
 });

 //ensure express server don't die with uncaught Exception
process.on('uncaughtException', function (err) {
    console.log(err);
})
  