import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// 🔑 Full Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// -------------------- DOM Elements --------------------
const inputFieldEl = document.querySelector("#input-field");
const addButton = document.getElementById("add-button");
const listItem = document.querySelector("#shopping-list");

// -------------------- Firebase Auth --------------------
signInAnonymously(auth).catch((error) => {
  console.error("Auth error:", error.message);
});

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  console.log("Signed in as:", user.uid);

  const shoppingListInDB = ref(database, "users/" + user.uid + "/data");

  // -------------------- Add Item --------------------
  addButton.addEventListener("click", (e) => {
    e.preventDefault();
    const inputValue = inputFieldEl.value.trim();
    if (inputValue === "") return;

    push(shoppingListInDB, {
      item: inputValue,
      completed: false,
    })
      .then(() => console.log("Item added:", inputValue))
      .catch((err) => console.error("Error adding item:", err));

    inputFieldEl.value = "";
  });

  // -------------------- Listen for Realtime Updates --------------------
  onValue(shoppingListInDB, (snapshot) => {
    clearList(listItem);

    if (snapshot.exists()) {
      const itemsArray = Object.entries(snapshot.val());
      for (const [id, value] of itemsArray) {
        // Handle old string values too
        const obj =
          typeof value === "string" ? { item: value, completed: false } : value;
        appendList(obj, id, shoppingListInDB);
      }
    }
  });
});

// -------------------- UI Helpers --------------------
function clearList(listItem) {
  listItem.innerHTML = "";
}

const addTextSpan = (li, textValue) => {
  const span = document.createElement("span");
  span.innerText = textValue;
  span.style.flexGrow = 5;
  span.style.textAlign = "left";
  span.style.paddingLeft = "1rem";
  li.appendChild(span);
  return span;
};

const addEditIcon = (li, textSpan, itemId, shoppingListInDB) => {
  const edit = document.createElement("span");
  edit.innerText = "🪶";
  edit.classList.add("edit");
  edit.style.marginRight = "0.5rem";
  edit.style.cursor = "pointer";

  edit.addEventListener("click", () => {
    const newValue = prompt("Edit item:", textSpan.innerText);
    if (newValue && newValue.trim() !== "") {
      textSpan.innerText = newValue;
      const location = ref(shoppingListInDB, itemId);
      set(location, {
        item: newValue,
        completed: li.classList.contains("completed"),
      });
    }
  });

  li.appendChild(edit);
};

const addDeleteIcon = (li, itemId, shoppingListInDB) => {
  const del = document.createElement("span");
  del.innerText = "🗑️";
  del.classList.add("delete");
  del.style.cursor = "pointer";

  del.addEventListener("click", () => {
    const location = ref(database, `users/${auth.currentUser.uid}/data/${itemId}`);
    remove(location)
      .then(() => li.remove())
      .catch((err) => console.error("Error deleting:", err));
  });

  li.appendChild(del);
};

// -------------------- Append List Item --------------------
const appendList = (itemObj, itemId, shoppingListInDB) => {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.style.margin = "1rem 1rem";

  // Set text
  const textSpan = addTextSpan(li, itemObj.item);

  // Add icons
  addEditIcon(li, textSpan, itemId, shoppingListInDB);
  addDeleteIcon(li, itemId, shoppingListInDB);

  // Apply completed class if stored
  if (itemObj.completed) li.classList.add("completed");

  // Double-click to toggle completed + persist
  li.addEventListener("dblclick", () => {
    li.classList.toggle("completed");
    const location = ref(database, `users/${auth.currentUser.uid}/data/${itemId}`);
    set(location, {
      item: textSpan.innerText,
      completed: li.classList.contains("completed"),
    })
      .then(() =>
        console.log(
          "Completed state updated:",
          li.classList.contains("completed")
        )
      )
      .catch((err) => console.error("Error updating completed:", err));
  });

  listItem.appendChild(li);
};

