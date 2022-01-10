import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import compact from 'lodash/compact';
import isString from 'lodash/isString';

/**
 * Initializes Firebase before using it
 *
 * @param {Object} clientCredentials Firebase client config object
 */
export const initFirebase = (clientCredentials) => {
  if (!firebase.apps.length) {
    firebase.initializeApp(clientCredentials);
    // Check that `window` is in scope for the analytics module!
    if (typeof window !== 'undefined') {
      // Enable analytics. https://firebase.google.com/docs/analytics/get-started
      if ('measurementId' in clientCredentials) {
        firebase.analytics();
        firebase.performance();
      }
    }
    console.log('Firebase was successfully init.');
  }
};

/**
 * Parses the ID and returns the correct type.
 * Because the querystrings are coming as string from req object
 * for the old IDs, we need to convert them to integer to be able
 * to use them for matching.
 *
 * Firebase IDs are stored as string in the Firestore. So we don't
 * need to convert them.
 *
 * @param {string|number} id The id to be parsed
 * @returns {string|number} Returns the manipulated id
 */
export const parseId = (id) => (id.length > 5 ? id : parseInt(id, 10));

/**
 * Updates the specified document's data with the passed params
 * in the specified collection
 *
 * @param {string} collection - The collection table to be used.
 * @param {string} documentId - The document ID to be updated
 * @param {Object} params - The params to be updated
 * @returns {boolean} The result of the update
 */
export const updateDocument = async ({ collection, docId, params }) => {
  const db = firebase.firestore();

  let result = false;

  // Update the doc without using dot notation.
  try {
    await db
      .collection(collection)
      .doc(docId)
      .update(params)
      .then(() => {
        result = true;
        console.log(`${docId} updated`);
      });
  } catch (e) {
    result = false;
  }

  return result;
};
/**
 * Creates or overwrites the existing document with the specified
 * document's data and the passed paramsin the specified collection
 *
 * @param {string} collection - The collection table to be used.
 * @param {string} documentId - The document ID to be updated
 * @param {Object} params - The params to be updated
 * @returns {boolean} The result of the update
 */
export const createDocument = async ({ collection, docId, params }) => {
  const db = firebase.firestore();

  let result = false;

  try {
    await db
      .collection(collection)
      .doc(docId)
      .set(params)
      .then(() => {
        result = true;
        console.log(`${docId} created`);
      });
  } catch (e) {
    console.log('createDocument.error', e);
    result = false;
  }

  return result;
};

/**
 * Fetches the collection count from the specified collection for the
 * specified document
 *
 * @param {Object} params - The params to be used for data fetch
 * @param {string} params.collection - The collection table to be used. Default: counter
 * @param {string} params.documentId - The document ID to be used
 * @returns {number} The count information
 */
export const getCollectionCount = async ({
  collection = 'counter',
  documentId,
}) => {
  const db = firebase.firestore();

  let count = 0;

  await db
    .doc(`${collection}/${documentId}`)
    .get()
    .then((doc) => {
      count = doc.data().count;
    });

  return count;
};

/**
 * Fetches the collection data with document ID or integer ID (old data)
 *
 * @param {Object} params - The params to be used for data fetch
 * @param {string|number} params.docId - The document ID of the record
 * @param {string} params.table - The collection table to be used
 * @param {boolean} params.returnRef - Whether to return a an object or Firebase snapshot
 * @param {boolean} params.single - Whether to return only 1 record
 * @returns {Object} The data
 */
export const fetchCollectionDataWithDocID = async ({
  table,
  docId,
  returnRef = false,
  single = false,
}) => {
  let data;
  if (docId) {
    const db = firebase.firestore();
    // is Firebase document ID?
    const isFBID = isString(docId);

    if (isFBID) {
      data = await db.doc(`${table}/${docId}`).get();
    } else {
      data = await fetchCollectionDataWith({
        table,
        field: 'id',
        value: docId,
      });
    }

    if (data && !returnRef) {
      data = isFBID
        ? { ...data.data(), id: data.data()?.id || docId, docId }
        : data;
    }
  }
  return Array.isArray(data) && single ? data?.[0] : data;
};

/**
 * Fetches the collection data with the specified collection table,
 * field and value.
 *
 * @param {Object} params - The params to be used for data fetch
 * @param {string} params.table - The collection table to be used
 * @param {string} params.field - The document field to be matched
 * @param {string|number} params.value - The field value to be matched
 * @param {boolean} params.returnField - Whether to return a specific field or all data
 * @param {boolean} params.single - Whether to return only 1 record
 * @returns {Object} The data
 */
export const fetchCollectionDataWith = async ({
  table,
  field,
  value,
  returnField,
  single,
}) => {
  const db = firebase.firestore();

  const junctions = await db.collection(table).where(field, '==', value).get();

  const filtered = junctions.docs
    .filter((doc) => doc.exists)
    .map((doc) =>
      returnField ? doc.data()?.[returnField] : { docId: doc.id, ...doc.data() }
    );

  return single ? filtered?.[0] : filtered;
};

/**
 * Fetches the collection data with the specified collection table
 * and an array of id
 *
 * @param {Object} params - The params to be used for data fetch
 * @param {string} params.table - The collection table to be used
 * @param {array} params.idList - The ID list
 * @returns {Object} The data
 */
export const fetchCollectionDataWithIdList = async (table, idList) => {
  if (Array.isArray(idList) && idList.length) {
    const db = firebase.firestore();

    const junctions = await db
      .collection(table)
      .where('id', 'in', idList)
      .get();

    return junctions.docs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  return [];
};

/**
 * Fetches all records for the specified collection table
 *
 * @param {string} table - The collection table to be used
 * @returns {Object} The data
 */
export const fetchCollectionDataAll = async (table) => {
  const db = firebase.firestore();

  const junctions = await db.collection(table).get();

  return junctions.docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches the collection data by using the specified collection table,
 * array of where conditions, sorting, limit information.
 *
 * @param {Object} params - The params to be used for data fetch
 * @param {string} params.table - The collection table to be used
 * @param {array of object} params.where - The conditions to be matched
 * @param {string} params.sortingField - The field to be used for sorting
 * @param {number} params.limit - The data limit to be returned
 * @param {object} params.startAfter - The document snapshot to be used for pagination
 * @returns {Object} The data
 *
 * @example
 * await fetchCollectionDataAllWhereMultiple({
 *   table: 'collection_points',
 *   whereArray: [
 *     { field: 'isActive', condition: '==', value: true },
 *     { field: 'tags', condition: 'array-contains-any', value: [1, 5, 6] }
 *   ],
 *   sortingField: 'id',
 *   limit: 6,
 *   startAfter: {Firebase last document ref snapshot object},
 * })
 */
export const fetchCollectionDataAllWhereMultiple = async ({
  table,
  whereArray,
  sortingField,
  limit,
  startAfter,
}) => {
  const db = firebase.firestore();

  let q = db.collection(table);

  // limit of the records
  if (limit) {
    q = q.limit(limit);
  }

  const whereConds =
    Array.isArray(whereArray) && whereArray.length
      ? whereArray.filter((c) => {
          return c !== 'undefined';
        })
      : [];

  if (whereConds.length) {
    whereConds.forEach((w) => {
      // if the value is array then check if there is any undefined
      // if so then remove the undefined value and check if there is
      // any other element
      if (Array.isArray(w.value) && compact(w.value).length) {
        q = q.where(w.field, w.condition, compact(w.value));
      }

      // if the value is not an array and is not empty
      if (!Array.isArray(w.value) && w.value) {
        q = q.where(w.field, w.condition, w.value);
      }
    });
  }

  if (sortingField) {
    q = q.orderBy(sortingField);
  }

  // fetch after `startAfter` value
  // for pagination
  if (startAfter) {
    q = q.startAfter(startAfter);
  }

  const junctions = await q.get();

  const data = junctions.docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }));

  const lastDoc = junctions.docs[junctions.docs.length - 1];

  return { data, lastDoc };
};
