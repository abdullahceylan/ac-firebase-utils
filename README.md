# AC Firebase Utils

[![NPM](https://img.shields.io/npm/v/ac-firebase-utils.svg)](https://www.npmjs.com/package/ac-firebase-utils)

**Firebase Helper Functions** ✨

Introduces useful helper functions to facilitate your Firebase Firestore operations.

_Documenting is in progress_
# Installation
`npm install ac-firebase-utils`

or 

`yarn add ac-firebase-utils`

# Functions

* **initFirebase()** - To initialize Firebase in your app, you need to provide your app's Firebase project configuration. This function helps to initialize your Firebase before using it. You can obtain your Firebase config object at any time by clicking [here](https://support.google.com/firebase/answer/7015592?authuser=0). The environment variables you need to define by using those config:
  * FIREBASE_API_KEY
  * FIREBASE_AUTH_DOMAIN
  * FIREBASE_DATABASE_URL
  * FIREBASE_PROJECT_ID
  * FIREBASE_STORAGE_BUCKET
  * FIREBASE_MESSAGING_SENDER_ID
  * FIREBASE_APP_ID

# Usage
- Make sure you have defined the required environment variables for Firebase initialization.

- Import `initFirebase` function and add it to the top of your application:
  ```js
  import { initFirebase } from 'ac-firebase-utils';

  initFirebase();
  ```

Now you are ready to use other helper functions.

  ```js
  // Fetches the collection data by using the specified collection table,
  // array of where conditions, sorting, limit information.
  import { fetchCollectionDataAllWhereMultiple } from 'ac-firebase-utils';

  // Fetch the active users list
  const users = await fetchCollectionDataAllWhereMultiple({
    table: 'users',
    whereArray: [
      { field: 'isActive', condition: '==', value: true },
    ],
    sortingField: 'id',
    limit: 6,
    // startAfter: {Firebase last document ref snapshot object for pagination},
  });

  // print
  console.log(users);

  // output:
  // {
  //   data: [
  //     // object of users
  //   ],
  //   lastDoc: {} // Firebase Document Snapshot to use for `startAfter` param for pagination. More info: https://firebase.google.com/docs/firestore/query-data/query-cursors
  // }

  ```
# License

MIT © Abdullah Ceylan
