const servicesData = require('../../../apis/apiMetaDemoServiceGroup2.json');
function stripAfterColon(str) {
    return str.split("/:")[0];
}

function convertPathTemplate(path) {
    return path.replace(/\/:(\w+)/g, "/${$1}");
}
function toCamelCase(str) {
    return str
        .toLowerCase() // Convert the entire string to lowercase
        .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase()); // Replace non-alphanumeric characters followed by a letter with the uppercase letter
}

function buildQueryString(obj) {
    if (!obj.pathParams || typeof obj.pathParams !== 'object') {
      return '';
    }
  
    const queryString = Object.entries(obj.pathParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  
    return queryString ? `?${queryString}` : '';
  }
// Function to generate the desired output from the JSON
function genAPIEndPointEnv() {
    console.log(
        `
/** 
* Generated Endpoint Entries: add them to the .env file.
**/ \n`
    )
    const services = servicesData.services;
    // Loop through each service and create the desired output
    services.forEach(service => {
        let envUrlTemplate = convertPathTemplate(service.uri);
        const entry = `${service.serviceId}_ENDPOINT=${envUrlTemplate}`;
        console.log(entry);
    });
}
// Function to generate a JavaScript object as code for process.env variables
function genAPIEnvObject() {
    const services = servicesData.services;
    console.log(`
/**
* Generated JavaScript code for process.env mappings: 
* Find the apiService.jsx ./lib/restful/services/apiService 
* copy the apiServiceInstance object and customRefreshTokenFn 
* function if not exits already
* copy the apiEndpoints object or merge the entries into the
* existing apiEndPoints object if already exists
**/ \n`);
    console.log(genApiServiceInstance());
    console.log('const apiEndpoints = {');

    services.forEach(service => {
        // For each serviceId, map it to process.env.SERVICEID_ENDPOINT
        const line = `  ${service.serviceId}: process.env.${service.serviceId}_ENDPOINT,`;
        console.log(line);
    });

    console.log('};\n');
    //console.log('module.exports = apiEndpoints;');
}


function genApiServiceInstance() {
    return `
const customRefreshTokenFn = async () => {
    return "custom token refresh function";
};
const apiServiceInstance = new apiService({
  baseURL: process.env.API_BASE_URL, // Main API base URL
  refreshBaseURL: process.env.API_TOKEN_REFRESH_TOKEN_BASE_URL, // Different base URL for refresh token
  refreshTokenEndpoint: process.env.API_ACCESS_REFRESH_TOKEN_ENDPONT, // Refresh token endpoint
  retryCount: process.env.API_RETRIES, // Retry up to 2 times
  retryInterval: process.env.API_RETRY_INTERVAL, // 1.5 seconds between retries
  refreshTokenFn: customRefreshTokenFn, // Custom refresh token function
});
export default apiServiceInstance;
    `;
}

// Function to generate the services export object
function genServices() {
    console.log(`
/**
* Generated JavaScript code for service to serviceId mappings: 
* Find the restAPIs.jsx ./lib/restful/services/restAPIs 
* copy the services object or merge the entries into the
* existing services object if already exists
**/ \n`);
    const services = servicesData.services;
    console.log('export const services = {');
    services.forEach(service => {
        const line = `  ${service.serviceId}: "${service.serviceId}",`;
        console.log(line);
    });

    console.log('};\n');
}


function genCallRestfulServices() {
    const services = servicesData.services;
    console.log(`
/**
* Generated JavaScript code for service selector to specific call method by serviceId: 
* Find the restAPIs.jsx ./lib/restful/services/restAPIs 
* copy the custom call selecteor _callRestfulService code generated
**/ \n`);

    console.log('export const _callRestfulService = (restful) => {');
    console.log('  switch (restful) {');

    services.forEach(service => {
        const camelCaseService = toCamelCase(service.serviceId);
        const line = `    case "${service.serviceId}": return _call${camelCaseService.charAt(0).toUpperCase() + camelCaseService.slice(1)};`;
        console.log(line);
    });

    console.log('    default: return "SERVICE NOT IMPLEMENTED";');
    console.log('  }');
    console.log('};');
}



function geneMethodCodes() {
    const services = servicesData.services;
    console.log(`
/**
* Generated JavaScript code for service call to axio specific call method mappings: 
* Find the restAPIs.jsx ./lib/restful/services/restAPIs 
* copy the custom call methods generated 
* if _setPathParameters does not exist add copy it as well. 
**/ \n`);
    console.log( `
        function _setPathParameters(apiPath, parameters) {
          return new Function(...Object.keys(parameters), \`return \\\`\${apiPath}\\\`;\`)(...Object.values(parameters));
        }
        `);
//     console.log(`
//         function _buildQueryString(obj) {
//   if (!obj.pathParams || typeof obj.pathParams !== 'object') {
//     return '';
//   }

//   const queryString = Object.entries(obj.pathParams)
//     .map(([key, value]) => \`${encodeURIComponent(key)}=${encodeURIComponent(value)}\`)
//     .join('&');

//   return queryString ? \`?${queryString}\` : '';
// }
//         `)
    services.forEach(service => {
        const camelCaseService = toCamelCase(service.serviceId);
        const functionName = `_call${camelCaseService.charAt(0).toUpperCase() + camelCaseService.slice(1)}`;

        const pathParams = service.inputDefinition.pathParams?Object.keys(service.inputDefinition.pathParams):[];
         let hasPathParameters = (pathParams.length > 0)?true:false;
         let hasValues = (service.inputDefinition.bodyData || service.inputDefinition.queryParams)?true:false;
         let hasHeaders = (service.inputDefinition.headers)?true:false;
         let aixoParams= hasValues?"values":"";
             aixoParams=aixoParams+(aixoParams!==""?(hasHeaders?",headers":"header"):"");
         let aixoParamsFinal = aixoParams!==""?","+aixoParams:"";
         let restPathParameters = !hasPathParameters?",{}":`,{${(hasPathParameters? pathParams.join(", ") : "")}}`
        let inputParamers = (hasPathParameters? pathParams.join(", ") : "")+ aixoParams;

        console.log("inputParamers:"+inputParamers)
        switch (service.method) {
            case 'GET':
            console.log(`
const ${functionName} = async (${inputParamers}) => { 
    return await apiService.get(_setPathParameters(apiEndpoints.${service.serviceId}${restPathParameters})${aixoParamsFinal}); };`);
                break;
            case 'POST':
                console.log(`
const ${functionName} = async (${inputParamers}) => { 
    return await apiService.post(_setPathParameters(apiEndpoints.${service.serviceId}${restPathParameters})${aixoParamsFinal});
};`);
                break;

            case 'PUT':
                console.log(`
const ${functionName} = async (${inputParamers}) => { 
    return await apiService.put(_setPathParameters(apiEndpoints.${service.serviceId}${restPathParameters})${aixoParamsFinal});
};`);
                break;

            case 'DELETE':
                console.log(`
const ${functionName} = async (${inputParamers}) => { 
    return await apiService.delete(_setPathParameters(apiEndpoints.${service.serviceId}${restPathParameters})${aixoParamsFinal});
};`);
                break;

            default:
                console.log(`// Unsupported method type: ${service.method}`);
        }
    });
}

// Function to generate method code based on the method in the JSON
function genCallMethodCodes() {
    const services = servicesData.services;

    console.log(`
/**
* Generated JavaScript code for services tasks runner wrapper for
* encapsolate exception, parameters and bodyData values handling
* Find the restAPIs.jsx ./lib/restful/services/restAPIs 
* copy the restfulTasks method generated 
**/ \n`);
    console.log('const restfulTasks = async  (serviceId) => {');
    console.log(' function runner(serviceId) {');
    console.log('  switch (serviceId) {');
    services.forEach(service => {
        const pathParams = service.inputDefinition.pathParams?Object.keys(service.inputDefinition.pathParams):[];
        //const bodyData = service.inputDefinition.bodyData;
        //let hasBody = service.inputDefinition.bodyData;
        //let bodyDataSeralizedString = (bodyData===null)?"":JSON.stringify(service.inputDefinition.bodyData);
       // let inputs = pathParams.length > 0 ? pathParams.join(", ") : "";
        //let inputParamers = inputs===""?(hasBody?"values":""): inputs+(hasBody?`, values`:"");

        let hasPathParameters = (pathParams.length > 0)?true:false;
        let hasValues = (service.inputDefinition.bodyData || service.inputDefinition.queryParams)?true:false;
        let hasHeaders = (service.inputDefinition.headers)?true:false;
        let aixoParams= hasValues?"values":"";
            aixoParams=aixoParams+(aixoParams!==""?(hasHeaders?",headers":"header"):"");
        let inputParamers = (hasPathParameters? pathParams.join(", ") : "")+ aixoParams;
        let invoker = `return callBack(await _callRestfulService(services.${service.serviceId})(${inputParamers}),callParams);` 
        let line = `    case "${service.serviceId}": 
        return async (${inputParamers}, callBack, callParams, errorHandler) => {
            try {
              ${invoker}
            } catch (error) {
                return errorHandler(error);
            }
          };
        `
        console.log(line);
        
    });
    console.log('    default: return "No Service Found";');
    console.log('  }');
    console.log('  }');
    console.log('return runner')
    console.log('};');
    console.log('\nexport default restfulTasks;');
}


// Function to generate method code based on the method in the JSON
function genCallCodes() {
    const services = servicesData.services;

    console.log(`
/**
* Generated JavaScript code for using services tasks runner wrapper 
* add import serviceTaskRunner, { services, _callRestfulService as restful } 
* from "../lib/restful/services/restAPIs";
* to your component and start using the the generated code template as example 
**/ \n`);
    services.forEach(service => {
        const camelCaseService = toCamelCase(service.serviceId);
        const varName = `_${camelCaseService.charAt(0).toUpperCase() + camelCaseService.slice(1)}TaskRunner`;

        const pathParams = service.inputDefinition.pathParams?Object.keys(service.inputDefinition.pathParams):[];
        let hasPathParameters = (pathParams.length > 0)?true:false;
        let hasValues = (service.inputDefinition.bodyData || service.inputDefinition.queryParams)?true:false;
        let hasHeaders = (service.inputDefinition.headers)?true:false;
        let aixoParams= hasValues?"values":"";
            aixoParams=aixoParams+(aixoParams!==""?(hasHeaders?",headers":"header"):"");
        let inputParamers = (hasPathParameters? pathParams.join(", ") : "")+ aixoParams;



        let line = `let ${varName} = serviceTaskRunner(services.${service.serviceId})(
            ${inputParamers}, 
            async (response, callParams) => {
                //callBack function
                //Get return data from the restufl call
                const data = response.data.payload;
                let result = null;
                //do something
                return result;
            }, 
            {
            //callBack Parameters
            }, 
            errorHandler
            );`;
        console.log(line);       
    });
}

// Call the function to generate entries for .env
genAPIEndPointEnv();
genAPIEnvObject();
genApiServiceInstance();
genServices();
genCallRestfulServices();
geneMethodCodes();
genCallMethodCodes();
genCallCodes();