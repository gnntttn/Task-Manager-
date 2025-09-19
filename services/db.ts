
const DB_NAME = 'ai-task-manager-db';
const DB_VERSION = 2;
const PROJECTS_STORE = 'projects';
const TASKS_STORE = 'tasks';
const SETTINGS_STORE = 'settings';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const taskStore = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const getSetting = async <T>(id: string): Promise<T | undefined> => {
    const db = await initDB();
    const transaction = db.transaction(SETTINGS_STORE, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : undefined);
        };
        request.onerror = () => {
            console.error(`Error getting setting ${id}:`, request.error);
            reject(request.error);
        };
    });
};

export const putSetting = async <T>(id: string, value: T): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ id, value });

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error(`Error putting setting ${id}:`, request.error);
            reject(request.error);
        };
    });
};

export const getAll = <T>(storeName: string): Promise<T[]> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
        resolve(request.result as T[]);
        };

        request.onerror = () => {
        console.error(`Error getting all items from ${storeName}:`, request.error);
        reject(request.error);
        };
    } catch(error) {
        reject(error);
    }
  });
};

export const add = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => {
        resolve();
        };

        request.onerror = () => {
        console.error(`Error adding item to ${storeName}:`, request.error);
        reject(request.error);
        };
    } catch(error) {
        reject(error);
    }
  });
};

export const put = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => {
        resolve();
        };

        request.onerror = () => {
        console.error(`Error updating item in ${storeName}:`, request.error);
        reject(request.error);
        };
    } catch(error) {
        reject(error);
    }
  });
};

export const deleteItem = (storeName: string, id: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
        resolve();
        };

        request.onerror = () => {
        console.error(`Error deleting item from ${storeName}:`, request.error);
        reject(request.error);
        };
    } catch(error) {
        reject(error);
    }
  });
};

export const deleteTasksByProjectId = (projectId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(TASKS_STORE, 'readwrite');
            const store = transaction.objectStore(TASKS_STORE);
            const index = store.index('projectId');
            const request = index.openCursor(IDBKeyRange.only(projectId));
            
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            
            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                console.error('Error deleting tasks by project ID:', transaction.error);
                reject(transaction.error);
            };
        } catch(error) {
            reject(error);
        }
    });
};