const admin = require("firebase-admin");
const serviceAccount = require("./path/to/your/serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Your full schema
const schema = {
  DEV: {
    ACCOUNTS: {
      APP_USER_ACCOUNT: {
        APPLICATIONS: {
          EDAX: {
            FEATURES: {
              CRED_MGMT: {},
              ACCT_MGMT: {},
              GROUP_MGMT: {},
              ACCOUNT_MGMT: {},
            },
            ROLES: {
              APP_USER: {},
              GROUP_MEMBER: {},
              GROUP_OWNER: {},
              ACCT_OWNER: {},
              APP_ADMIN: {},
              SYS_ADMIN: {},
            },
          },
        },
      },
      SYS_ACCOUNT: {
        APPLICATIONS: {
          EDAX: {
            FEATURES: {
              CRED_MGMT: {},
              ACCT_MGMT: {},
              GROUP_MGMT: {},
              ACCOUNT_MGMT: {},
            },
            ROLES: {
              APP_USER: {},
              GROUP_MEMBER: {},
              GROUP_OWNER: {},
              ACCT_OWNER: {},
              APP_ADMIN: {},
              SYS_ADMIN: {},
            },
          },
        },
      },
      APP_ADMIN_ACCOUNT: {
        APPLICATIONS: {
          EDAX: {
            FEATURES: {
              CRED_MGMT: {},
              ACCT_MGMT: {},
              GROUP_MGMT: {},
              ACCOUNT_MGMT: {},
            },
            ROLES: {
              APP_USER: {},
              GROUP_MEMBER: {},
              GROUP_OWNER: {},
              ACCT_OWNER: {},
              APP_ADMIN: {},
              SYS_ADMIN: {},
            },
          },
        },
      },
    },
    APPLICATIONS: {
      EDAX: {
        FEATURES: {
          CRED_MGMT: {},
          ACCT_MGMT: {},
          GROUP_MGMT: {},
          ACCOUNT_MGMT: {},
        },
        ROLES: {
          APP_USER: {},
          GROUP_MEMBER: {},
          GROUP_OWNER: {},
          ACCT_OWNER: {},
          APP_ADMIN: {},
          SYS_ADMIN: {},
        },
      },
    },
    USERS: {
      BIGBANG: {
        ACCOUNTS: {
          APP_USER_ACCOUNT: {
            APPLICATIONS: {
              EDAX: {
                FEATURES: {
                  CRED_MGMT: {},
                  ACCT_MGMT: {},
                  GROUP_MGMT: {},
                  ACCOUNT_MGMT: {},
                },
                ROLES: {
                  APP_USER: {},
                  GROUP_MEMBER: {},
                  GROUP_OWNER: {},
                  ACCT_OWNER: {},
                  APP_ADMIN: {},
                  SYS_ADMIN: {},
                },
              },
            },
          },
          SYS_ACCOUNT: {
            APPLICATIONS: {
              EDAX: {
                FEATURES: {
                  CRED_MGMT: {},
                  ACCT_MGMT: {},
                  GROUP_MGMT: {},
                  ACCOUNT_MGMT: {},
                },
                ROLES: {
                  APP_USER: {},
                  GROUP_MEMBER: {},
                  GROUP_OWNER: {},
                  ACCT_OWNER: {},
                  APP_ADMIN: {},
                  SYS_ADMIN: {},
                },
              },
            },
          },
          APP_ADMIN_ACCOUNT: {
            APPLICATIONS: {
              EDAX: {
                FEATURES: {
                  CRED_MGMT: {},
                  ACCT_MGMT: {},
                  GROUP_MGMT: {},
                  ACCOUNT_MGMT: {},
                },
                ROLES: {
                  APP_USER: {},
                  GROUP_MEMBER: {},
                  GROUP_OWNER: {},
                  ACCT_OWNER: {},
                  APP_ADMIN: {},
                  SYS_ADMIN: {},
                },
              },
            },
          },
        },
      },
    },
  },
};

// Recursive function to create documents
async function createSchema(path, data) {
  for (const [key, value] of Object.entries(data)) {
    const docRef = db.doc(`${path}/${key}`);
    await docRef.set({}); // create empty doc

    if (value && typeof value === "object" && Object.keys(value).length > 0) {
      await createSchema(`${path}/${key}`, value);
    }
  }
}

// Main entry point
async function loadSchema(rootKey) {
  if (!schema[rootKey]) {
    console.error(`Root key "${rootKey}" not found in schema.`);
    return;
  }

  console.log(`Creating schema under root: ${rootKey}`);
  await createSchema(rootKey, schema[rootKey]);
  console.log("Schema creation complete.");
}

// Change 'PROD' to any other root key like 'DEV'
loadSchema("DEV").catch(console.error);




// ✅ How to Use:
// Replace "./path/to/your/serviceAccountKey.json" with the path to your Firebase Admin SDK service account key file.

// If you want to use "PROD" instead of "DEV", just change this line:

// loadSchema("DEV");
// loadSchema("PROD");
// node goldenSchemaLoader.js
