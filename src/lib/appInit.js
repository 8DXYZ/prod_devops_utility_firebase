const appConfig = require("./app.json");
const firebaseService = require('./firebase');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const realtime = firebaseService.getAdminRealtimeDBService();
const firestore = firebaseService.getAdminFirestoreService();
const storage = firebaseService.getAdminStorageBucket();;
const adminAuth = firebaseService.getAdminAuthService();
const clientAuth = firebaseService.getAuthService() //clientside

const DEBUG = process.env.DEBUG;
const RESPONSE = { SUCCESS: 'success', ERROR: 'error' };


/**
 * Substitutes `x` and `y` in the template string.
 * @param {string} template - The template string with placeholders.
 * @param {object} values - An object containing `x` and `y` values.
 * @returns {string} - The formatted string with substituted values.
 */
function transform(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
}

appConfig.DEBUG= process.env.DEBUG;
appConfig.ENV = process.env.ENV;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.SERVICES=firebaseService;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.ADMIN_REALTIME=realtime;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.ADMIN_FIRESTORE=firestore;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.ADMIN_STORAGE=storage;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.ADMIN_AUTH=adminAuth;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_SERVICES.CLIENT_AUTH=clientAuth;
appConfig.APP_SERVICE_RESOURCES.ROOT_PATHS.FIRESTORE_ROOT=process.env.FIRESTORE_ROOT;
appConfig.APP_SERVICE_RESOURCES.ROOT_PATHS.STORAGE_ROOT=process.env.STORAGE_ROOT;
appConfig.APP_SERVICE_RESOURCES.ROOT_PATHS.FIRESTORE_APP_USERS_ROOT=`${process.env.FIRESTORE_ROOT}/${process.env.FIRESTORE_APP_USERS_DIR}`;
appConfig.APP_SERVICE_RESOURCES.ROOT_PATHS.STORAGE_APP_ROOT=`${process.env.STORAGE_ROOT}/${process.env.STORAGE_APP_USERS_DIR}`;
appConfig.APP_SERVICE_RESOURCES.ROOT_PATHS.USER_DATA_PATH=process.env.USER_DATA_PATH;
appConfig.TRANSFORM=transform;
appConfig.APP_SERVICE_RESOURCES.FIREBASE_AUTH.API_KEY=process.env.FIREBASE_API_KEY;
     

appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.STRIPE_SECRET=process.env.STRIPE_SECRET;
appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.STRIPE_WEBHOOK_SECRET=process.env.STRIPE_WEBHOOK_SECRET;
appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.SERVICES=stripe;
appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.STRIPE_CHECKOUT_SESSION_SUCCESS_URL=process.env.STRIPE_CHECKOUT_SESSION_SUCCESS_URL;
appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.STRIPE_CHECKOUT_SESSION_CANCEL_URL=process.env.STRIPE_CHECKOUT_SESSION_CANCEL_URL;
appConfig.APP_SERVICE_RESOURCES.STRIPE_SERVICES.STRIPE_BILLING_PORTAL_SESSION_REDIRECT_URL=process.env.STRIPE_BILLING_PORTAL_SESSION_REDIRECT_URL;

module.exports = appConfig;
// Example usage
// const template = "/USERS/{UID}/DATA/{APP_NAME}/";
// const values = { UID: "12345", APP_NAME: "67890" };
// const result = substituteTemplate(template, values);


///IREVA/DEV_01/USERS/eHM0oOy9HYcvEhbuR1SSqguetz33/DATA/EDAX/CREDENTIALS/

//let collectionPath  =  "IREVA/DEV_01/USERS/eHM0oOy9HYcvEhbuR1SSqguetz33/DATA/EDAX/CREDENTIALS/";
//userAppRootPath: "IREVA/DEV_01/USERS/eHM0oOy9HYcvEhbuR1SSqguetz33/DATA",
//USERS/eHM0oOy9HYcvEhbuR1SSqguetz33/DATA/EDAX/CREDENTIALS/

// FIRESTORE_APP_USERS_ROOT=/IREVA/DEV_01
// STORAGE_APP_ROOT=/IREVA/DEV_01
// USER_DATA_PATH=/USERS/{UID}/DATA/{APP_NAME}
// APP_NAME=EDAX

// try {
//   // Verify the ID token
//   await admin.auth().verifyIdToken(idToken);
//   console.log("ID token verified successfully");
//   next(); // Token is valid, continue to the route
// } catch (error) {
//   if (error.code === "auth/id-token-expired") {
//     console.info("ID token expired. Attempting to refresh.");
//     try {
//       // Decode the expired token to extract uid
//       const decoded = jwt.decode(idToken);
//       const uid = decoded?.user_id;


//       const idToken = req.headers.authorization?.split(" ")[1];
  
//       if (!idToken) {
//         console.warn("Missing ID token in request");
//         return res.status(401).json({ error: "Missing ID token" });
//       }

// const preprocess= async (req, res, next) => {

//   const authHeader = req.headers['authorization'];
//   const idToken = req.headers.authorization?.split(" ")[1];
//   x-app-version
//   x-app-id
//   x-app-token
//   x-app-name
// X-Api-Key: <api-key>
//   const appCredentials = req.headers.authorization?.split(" ")[1];
//   if (!idToken) {
//     console.warn("Missing ID token in request");
//     return res.status(401).json({ error: "Missing ID token" });
//   }
 
 
//   authorizationString = authHeader.split(' ')[1]; // Get the token part after "Bearer"


//   let status = null;
//   if (authHeader) {
//     // Split the header into "Bearer" and the token
//     authorizationString = authHeader.split(' ')[1]; // Get the token part after "Bearer"
//     const [sysAppVersionClient, appIdFromClient, appTokenFromClient] = authorizationString.split(":");






//     let appVersion = sysAppVersionClient.replace(/\./g, '_');
//     let keysKey = `${APP_NAME}_${appIdFromClient}`;
//     const sysKey = (await keyRef.child(keysKey).child(appVersion).once('value')).val();
//     let tokenKey = tokenOps.SIGN_APP_TOKEN(appTokenFromClient, sysKey);
//    // console.log("-----keysKey------"+keysKey)
//    // console.log("-------sysKey----"+sysKey)
//    // console.log("-------tokenKey----"+tokenKey)
//     const tokenEntry = (await tokensRef.child(tokenKey).once('value')).val();
//   //  console.log("-------tokenEntry----"+tokenEntry)
//   //  console.log( (await tokensRef.child(tokenKey).once('value')).val());
//     if (!tokenEntry || !sysKey) { //record does not exists
//       status = false;
//     } else {
//       status = tokenOps.VALIDATE_APP_TOKEN(
//         authorizationString,
//         sysKey, //system key
//         tokenEntry.secret_key, //app key()
//         tokenEntry.application_id, //app from Sytsem
//         APP_VERSION, //from system
//         tokenEntry.application_token //stored application_token
//       );
//       status = status && tokenEntry.status == "ACTIVE";
//     }
//     if (!status) {
//       return res.status(403).json({ message: 'Authorization Failed' });
//     }
//     next();
//   }else {
//     return res.status(403).json({ message: 'Authorization Failed' });
//   }
