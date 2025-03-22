// authMiddleware.js
const jwt = require('jsonwebtoken');
const { tokenOps } = require('@8DXYZ/application-util-lib-bke');
const firebaseService = require('../lib/firebase');
const dbSource = firebaseService.getAdminRealtimeDBService();
const root = `${process.env.ENV}/${process.env.FIREBASE_REALTIME_ATM_ROOT}`;
const tokensRef = dbSource.ref(`${root}/tokens`);
const keyRef = dbSource.ref(`${process.env.ENV}/keys`);
const DEBUG = process.env.DEBUG;
const APP_NAME = process.env.APP_NAME;
const APP_VERSION = process.env.APP_VERSION;


const authenticate = async (req, res, next) => {

  const authHeader = req.headers['authorization'];
  let status = null;
  if (authHeader) {
    // Split the header into "Bearer" and the token
    authorizationString = authHeader.split(' ')[1]; // Get the token part after "Bearer"
    const [sysAppVersionClient, appIdFromClient, appTokenFromClient] = authorizationString.split(":");
    let appVersion = sysAppVersionClient.replace(/\./g, '_');
    let keysKey = `${APP_NAME}_${appIdFromClient}`;
    const sysKey = (await keyRef.child(keysKey).child(appVersion).once('value')).val();
    let tokenKey = tokenOps.SIGN_APP_TOKEN(appTokenFromClient, sysKey);
   // console.log("-----keysKey------"+keysKey)
   // console.log("-------sysKey----"+sysKey)
   // console.log("-------tokenKey----"+tokenKey)
    const tokenEntry = (await tokensRef.child(tokenKey).once('value')).val();
  //  console.log("-------tokenEntry----"+tokenEntry)
  //  console.log( (await tokensRef.child(tokenKey).once('value')).val());
    if (!tokenEntry || !sysKey) { //record does not exists
      status = false;
    } else {
      status = tokenOps.VALIDATE_APP_TOKEN(
        authorizationString,
        sysKey, //system key
        tokenEntry.secret_key, //app key()
        tokenEntry.application_id, //app from Sytsem
        APP_VERSION, //from system
        tokenEntry.application_token //stored application_token
      );
      status = status && tokenEntry.status == "ACTIVE";
    }
    if (!status) {
      return res.status(403).json({ message: 'Authorization Failed' });
    }
    next();
  }else {
    return res.status(403).json({ message: 'Authorization Failed' });
  }
  



  //0.0.0:1d68cf85-158d-46dc-bf99-04e637da95ab:6a4d826b322c0dc612641ac83f5d977cb281635108baa4c31780730586610d59

  // SYS_KEY=774b2a4c-93c9-447f-bda5-0b63d0deb016
  // APP_KEY=c6cb8b72-e020-4c3f-84e5-7a892514a46a


  // APP_ID=1d68cf85-158d-46dc-bf99-04e637da95ab  from application entry

  // APP_CL_ID=06ccf4df-017e-4c14-8770-ea9129a1be78
  // {
  //   appToken: '6a4d826b322c0dc612641ac83f5d977cb281635108baa4c31780730586610d59',
  //   signedAppToken: '2c715a91f11b267ddaff4ea487d25a2833e2357aa8635491d7b9582c2bc4d278'
  // }
  // console.log(tokenOps.GEN_JWT_TOKEN(
  //   {appId:"1d68cf85-158d-46dc-bf99-04e637da95ab", 
  //   appToken:"6a4d826b322c0dc612641ac83f5d977cb281635108baa4c31780730586610d59"}
  //   ,JWT_SECRET
  //   ,{}
  // ));
  //app_id                                   system key                                  app key
  //console.log(tokenOps.GEN_TOKEN_N_SIGN("1d68cf85-158d-46dc-bf99-04e637da95ab","774b2a4c-93c9-447f-bda5-0b63d0deb016","c6cb8b72-e020-4c3f-84e5-7a892514a46a"));
  //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjFkNjhjZjg1LTE1OGQtNDZkYy1iZjk5LTA0ZTYzN2RhOTVhYiIsImFwcFRva2VuIjoiNmE0ZDgyNmIzMjJjMGRjNjEyNjQxYWM4M2Y1ZDk3N2NiMjgxNjM1MTA4YmFhNGMzMTc4MDczMDU4NjYxMGQ1OSIsImlhdCI6MTczMTA2NDk2N30.iLSQc5G9ZL5VNK-0E48e4Bvk7_eyLXKzWSyub0FJf40
  //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjFkNjhjZjg1LTE1OGQtNDZkYy1iZjk5LTA0ZTYzN2RhOTVhYiIsImFwcFRva2VuIjoiNmE0ZDgyNmIzMjJjMGRjNjEyNjQxYWM4M2Y1ZDk3N2NiMjgxNjM1MTA4YmFhNGMzMTc4MDczMDU4NjYxMGQ1OSIsImlhdCI6MTczMTA2MzkzN30.3mWXMVhnj6N6wWho_irTWoUDTW5MbXcIm72ypX1_ISI

  
};

module.exports = authenticate;
