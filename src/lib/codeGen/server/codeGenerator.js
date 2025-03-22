
//Need to hard change the following line to point to the right place
const apiMeta = require('../../../apis/apiMetaDemoServiceGroup1.json');
const args = process.argv.slice(2);
function generateAPIControllerFile(definitions, servicePath, apiMetaFileName) {
    // Generate the destructuring import statement
    const handlerMethods = definitions.map(def => def.handlerMethod).join(', ');
    const importStatement = `const { ${handlerMethods} } = require("${servicePath}");`;

    // Generate serviceIds object
    const serviceIdsObject = definitions.reduce((acc, def) => {
        acc[def.serviceId] = def.serviceId;
        return acc;
    }, {});
    const serviceIds = `const serviceIds = ${JSON.stringify(serviceIdsObject, null, 2)};`;

    const apiMetaFileId = `const apiMetaFile = '${apiMetaFileName}';`;


   // Generate secuirty middleWare
  //  if(def.security){
  //       securityMiddleWares=`\n const securityMiddleWares = {
   let securityMiddleWares = null;
   let securityMiddleWaresImports = null;
  
   securityMiddleWares =  definitions
   .map(def => {
       let secruityCorsOptions = null;
       let seurtyHeaders =  null;
       let rateLimit = null;

       if(def.security){
        securityMiddleWaresImports = `
       const rateLimit = require('express-rate-limit');
       const cors = require('cors');
       const helmet = require('helmet');
       `;
       }
       if(def.security){
       securityMiddleWares=`
        ${def.serviceId}: {`;

        if(def.security.corsOptions){
          secruityCorsOptions = `
           "apiCorsOptions": () => cors(${JSON.stringify(def.security.corsOptions)})
           `;
        }
        if(def.security.headers){
          seurtyHeaders = `
           "contentSecurityPolicy": () => helmet(${JSON.stringify(def.security.headers)})
           `;
        }
        if(def.security.rateLimit){
          rateLimit = `
          "rateLimit": rateLimit(${JSON.stringify(def.security.rateLimit)})
          `;
        }
       

        return securityMiddleWares+[secruityCorsOptions,seurtyHeaders,rateLimit].join(",")+"}";
       }else{
        return null;
       }
       

       }).filter(entry=>(entry!=null)).join(",");

    if(securityMiddleWares){
         securityMiddleWares=`\n const securityMiddleWares = {`+securityMiddleWares+"}";
    }
    // Generate module.exports dynamically
    const moduleExports = definitions
        .map(def => {
            return `

    ${def.handlerMethod}: async (req, res) => {
      let queryParams = req.query;
      let pathParams = req.params;
      let bodyData = req.body;

      let data = await ${def.handlerMethod}({
      operation:'${def.method.toUpperCase()}',
      payload:{

      },
      customValidator:()=>{
        return {status: true};
      },
      responseDefinition:req.app.responseDefintions[apiMetaFile][serviceIds.${def.serviceId}],
      useCustomResponse: true,  //true to use native message object for response
      next: false //if true return respone object otherwise return data object for next operationt to consum 
      });
      return res.status(data.statusCode).json(data);
    }`;
        })
        .join(',\n');

    const exportsStatement = `module.exports = {\n${(securityMiddleWaresImports)?"security:securityMiddleWares,":""}\n${moduleExports}\n};`;

    //Combine all statements
    return `${importStatement}\n\n${serviceIds}\n\n ${apiMetaFileId}\n\n${(securityMiddleWaresImports)?securityMiddleWaresImports:""}\n\n${securityMiddleWares}\n ${exportsStatement}`;
}




// function generateServiceMethodsObject(definitions) {
//     const generatedMethods = {};

//     definitions.forEach(({ handlerMethod }) => {
//         generatedMethods[`_${handlerMethod}`] = async (data, responseDefinition) => {
//             try {
//                 const payload = {};
//                 return handleResponse({
//                     state: RESPONSE.SUCCESS,
//                     code: null,
//                     data: payload,
//                     native: {},
//                     responseDefinition: responseDefinition,
//                     isDebug: DEBUG
//                 });
//             } catch (error) {
//                 return handleResponse({
//                     state: RESPONSE.ERROR,
//                     code: error.code ? error.code : "unknown",
//                     native: error.message,
//                     responseDefinition: responseDefinition,
//                     isDebug: DEBUG
//                 });
//             }
//         };
//     });

//     return generatedMethods;
// }



// function generateServiceMethods(definitions) {
//     // Generate dynamic function definitions

//     const functionDefinitions = definitions.map(({ serviceId, handlerMethod, response, method }) => {

//         const errorCases = Object.keys(response.errors)
//             .map(errorCode => `
//             case "${errorCode}": 
//               return handleResponse({
//                 state: RESPONSE.ERROR,
//                 code: "${errorCode}",
//                 responseDefinition: responseDefinition,
//                 isDebug: ${DEBUG}
//               });
//         `).join('\n');

//         return `
//         const _${handlerMethod} = async (operationObj) => {
//           operationObj.operation='${method}';
//           const handleRequest=async (operationObj)=>{
//             return await firebaseCRUD(operationObj);
//           }
//         return await handleRequest(operationObj);


//       const customHandler=(operationObj)=>{
//       try {    
//         //TBI

//         const payload = {};

//         let inTheCaseOf = false; 
//         // Replace with your actual condition logic
  
//         if (inTheCaseOf) {
//           const caseOf = ""; // Replace with your case condition
//           switch (caseOf) {${errorCases}
//           }
//         }

//         return handleResponse({
//           state: RESPONSE.SUCCESS,
//           code: null,
//           data: payload,
//           native: {},
//           responseDefinition: responseDefinition,
//           isDebug: ${DEBUG}  
//         });

//       } catch (error) {
//         return handleResponse({
//           state: RESPONSE.ERROR,
//           code: error.code ? error.code : "unknown",
//           native: error.message,
//           responseDefinition: responseDefinition,
//           isDebug: ${DEBUG}  
//         });
//       }

//       }
   
//     };`;
//     }).join('\n\n');

//     // Generate module exports block
//     const moduleExports = `
//       module.exports = {
//       ${definitions.map(({ handlerMethod }) => `
//       ${handlerMethod}: async (operationObj) => {
//         let payload = JSON.parse(JSON.stringify(await _${handlerMethod}(operationObj)));
//         return payload;
//       }`).join(',\n')}
//      };`;

//     // Combine both the function definitions and module exports block
//     return functionDefinitions + '\n\n' + moduleExports;
// }

function generateServiceMethods(definitions) {
  // Generate dynamic function definitions
  const importStatements = [
    `const { v4: uuidv4 } = require('uuid');`,
    `const crypto = require('crypto');`,
    `const firebaseService = require('../lib/firebase');`,
    `const { handleResponse, firebaseCRUD, firebaseRestful } = require('@8DXYZ/firebase-restful');`,
    `const dbSource = firebaseService.getAdminRealtimeDBService();`,
    `const root = ${process.env.ENV}/${process.env.FIREBASE_REALTIME_UAA_ROOT};`,
    `const ref = dbSource.ref(${process.env.ENV}/${process.env.FIREBASE_REALTIME_UAA_ROOT}/updateme);`,
    `const RESPONSE = { SUCCESS: 'success', ERROR: 'error' };`,
    `const DEBUG = process.env.DEBUG;`
  ].join('\n');

  const functionDefinitions = definitions.map(({ serviceId, handlerMethod, response, method }) => {

      const errorCases = Object.keys(response.errors)
          .map(errorCode => `
          case "${errorCode}": 
            return handleResponse({
              state: RESPONSE.ERROR,
              code: "${errorCode}",
              responseDefinition: responseDefinition,
              isDebug: ${DEBUG}
            });
      `).join('\n');

      return `
      const _${handlerMethod} = async (operationObj) => {
        operationObj.operation='${method}';
        //operationObj.next = false; //determin if this is a terminating with response back to the caller

        operationObj.ref=ref;
        //use default reference implementation of custom error using native error response

        operationObj.exec=async (operationObj)=>{return await firebaseRestful.${method}(operationObj)};

        //to override the default referene implementation do this
        //operationObj.exec = async (operationObj)=>{
          ////do the database operations
          //let result = null;
          //const {payload, ref}= operationObj;
          //return result;
        //}
        
        return await firebaseCRUD(operationObj);
        
      // use for standard error handling     
      //const standardHandling=(operationObj)=>{
      //try {    
       ////TBI

        //const payload = {};

        //let inTheCaseOf = false; 
        //// Replace with your actual condition logic
  
        //if (inTheCaseOf) {
          //const caseOf = ""; // Replace with your case condition
          //switch (caseOf) {
          /*
          ${errorCases}
          */
          //}
        //}
        //return handleResponse({
          //state: RESPONSE.SUCCESS,
          //code: null,
          //data: payload,
          //native: {},
         // responseDefinition: responseDefinition,
         // isDebug: ${DEBUG}  
       // });
      //} catch (error) {
       // return handleResponse({
        //  state: RESPONSE.ERROR,
         // code: error.code ? error.code : "unknown",
         // native: error.message,
         // responseDefinition: responseDefinition,
         // isDebug: ${DEBUG}  
        //});
      //}
      //}
      };`;
  }).join('\n\n');


  // Generate module exports block
  const moduleExports = `
    module.exports = {
    ${definitions.map(({ handlerMethod }) => `
    ${handlerMethod}: async (operationObj) => {
      let payload = JSON.parse(JSON.stringify(await _${handlerMethod}(operationObj)));
      return payload;
    }`).join(',\n')}
   }`;

  // Combine both the function definitions and module exports block
  return importStatements+'\n\n'+functionDefinitions + '\n\n' + moduleExports;
}



const RESPONSE = { SUCCESS: 'success', ERROR: 'error' };
const DEBUG = args[3];//true;
const servicePath = args[2];//"../services/FeatureManagementServices";
const apiMetaFileName = args[1];//"apiMetaUAAFM";  // This can be a variable name

//const controllerModule = generateAPIControllerFile(apiMeta.services, servicePath, apiMetaFileName);
//const serviceMethods = generateServiceMethods(apiMeta.services);

//console.log(args)


switch (args[0]) {
    case "controller": return console.log(generateAPIControllerFile(apiMeta.services, servicePath, apiMetaFileName));
    case "service": return console.log(generateServiceMethods(apiMeta.services));
    default: console.log("usage: node ./src/lib/codeGenerator.js [controller|service] ${apiMetaFile} ${servicePath} ${debug}");
};


