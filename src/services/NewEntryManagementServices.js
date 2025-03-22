const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const firebaseService = require('../lib/firebase');
const { handleResponse, firebaseCRUD, firebaseRestful } = require('@8DXYZ/firebase-restful');
const dbSource = firebaseService.getAdminRealtimeDBService();
const root = `${process.env.ENV}/${process.env.FIREBASE_REALTIME_DEMO_ROOT}`;
const ref = dbSource.ref(`${root}/entries`);
const RESPONSE = { SUCCESS: 'success', ERROR: 'error' };
const DEBUG = process.env.DEBUG;


      const _createNewEntry = async (operationObj) => {
        operationObj.operation='POST';
        operationObj.ref=ref;
        operationObj.exec=async (operationObj)=>{return await firebaseRestful.POST(operationObj)};
        return await firebaseCRUD(operationObj);
      };


      const _getNewEntryById = async (operationObj) => {
        operationObj.operation='GET';
        operationObj.ref=ref;
        operationObj.exec=async (operationObj)=>{return await firebaseRestful.GET(operationObj)};
        return await firebaseCRUD(operationObj);
      };


    module.exports = {

    createNewEntry: async (operationObj) => {
      let payload = JSON.parse(JSON.stringify(await _createNewEntry(operationObj)));
      return payload;
    },

    getNewEntryById: async (operationObj) => {
      let payload = JSON.parse(JSON.stringify(await _getNewEntryById(operationObj)));
      return payload;
    }
   }