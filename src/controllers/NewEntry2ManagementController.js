const { updateNewEntry, deleteNewEntry,uploadFiles} = require("../services/NewEntry2ManagementServices");
const serviceIds = {
  "UPDATE_NEW_ENTRY": "UPDATE_NEW_ENTRY",
  "DELETE_NEW_ENTRY": "DELETE_NEW_ENTRY",
  "UPLOAD_FILES": "UPLOAD_FILES",
};

 const apiMetaFile = 'apiMetaDemoServiceGroup2';

  module.exports = {

    updateNewEntry: async (req, res) => {
        console.log(req.params);
      let data = await updateNewEntry({
      operation:'PUT',
      payload:{
        "id":req.params.entryId,
        "values":req.body
      },
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.UPDATE_NEW_ENTRY],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum
      });
      return res.status(data.statusCode).json(data);
    },

    deleteNewEntry: async (req, res) => {
      let data = await deleteNewEntry({
      operation:'DELETE',
      payload:req.body,
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.DELETE_NEW_ENTRY],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum
      });
      return res.status(data.statusCode).json(data);
    },
    uploadFiles: async (req, res) => {
      let queryParams = req.query;
      let pathParams = req.params;
      let bodyData = req.body;
      console.log(req.files)
      let data = await uploadFiles({
      operation:'POST',
      payload:{
        req:req,
        res:res
      },
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.UPLOAD_FILES],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum
      });
      return res.status(data.statusCode).json(data);
    },
};