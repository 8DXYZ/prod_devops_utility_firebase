const { createNewEntry, getNewEntryById } = require("../services/NewEntryManagementServices");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serviceIds = {
  "CREATE_NEW_ENTRY": "CREATE_NEW_ENTRY",
  "GET_NEW_ENTRY": "GET_NEW_ENTRY"
};

 const apiMetaFile = 'apiMetaDemoServiceGroup1';
 let x = rateLimit({ "windowMs": 90000, "max": 100,  "keyGenerator": (req) => req.body ,"message": "Too many requests from this IP, please try again later" });
const securityMiddleWares = {
  CREATE_NEW_ENTRY: {
    "apiCorsOptions": () =>  cors({ "origin": "trustedOrigin", "methods": ["POST"], "credentials": "true" }),
    "contentSecurityPolicy": () => helmet({ "directives": { "defaultSrc": ["'self'"], "scriptSrc": ["'self'", "https://trusted-scripts.com"], "styleSrc": ["'self'", "https://trusted-styles.com"], "imgSrc": ["'self'", "data:"] } }),
    "rateLimit": rateLimit({ "windowMs": 90000, "max": 100,  "keyGenerator": (req) => req.body ,"message": "Too many requests from this IP, please try again later" })
  }
}

  module.exports = {
    security: securityMiddleWares,
    createNewEntry: async (req, res) => {
      // Query Parameters: req.query
      // Path Parameters: req.params
      // Body Data: req.body (with middleware like express.json() for JSON)

      let data = await createNewEntry({
      operation:'POST',
      payload:req.body,
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.CREATE_NEW_ENTRY],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum
      });
      return res.status(data.statusCode).json(data);
    },

    getNewEntryById: async (req, res) => {
     
      let data = await getNewEntryById({
      operation:'GET',
      payload:{
   
      },
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.GET_NEW_ENTRY],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum
      });
      return res.status(data.statusCode).json(data);
    }
};