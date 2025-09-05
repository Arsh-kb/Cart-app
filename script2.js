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
  apiKey: "AIzaSyAkS6uwNFtT32WztLije-uErDnvucKcmzQ",
  authDomain: "shopping-cart-d2963.firebaseapp.com",
  databaseURL: "https://shopping-cart-d2963-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shopping-cart-d2963",
  storageBucket: "shopping-cart-d2963.firebasestorage.app",
  messagingSenderId: "464387276253",
  appId: "1:464387276253:web:57fc2ce35f20086fe8ca34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM elements
const inputFieldEl = document.querySelector("#input-field");
const addButton = document.getElementById("add-button");
const listItem = document.querySelector("#shopping-list");

// Sign in anonymously
signInAnonymously(auth).catch((error) => {
  console.error("Auth error:", error.message);
});

// Wait for auth to complete
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  console.log("Signed in as:", user.uid);

  // Each user has their own data node
  const shoppingListInDB = ref(database, "users/" + user.uid + "/data");

  // --- Add item ---
  addButton.addEventListener("click", (e) => {
    e.preventDefault();
    const inputValue = inputFieldEl.value.trim();
    if (inputValue === "") return;

    push(shoppingListInDB, inputValue)
      .then(() => console.log("Item added:", inputValue))
      .catch((err) => console.error("Error adding item:", err));

    inputFieldEl.value = "";
  });

  // --- Listen for realtime updates ---
  onValue(shoppingListInDB, (snapshot) => {
    clearList(listItem);

    if (snapshot.exists()) {
      const itemsArray = Object.entries(snapshot.val());
      for (const [id, value] of itemsArray) {
        appendList(value, id, shoppingListInDB);
      }
    }
  });
});

// --- UI Helpers ---
function clearList(listItem) {
  listItem.innerHTML = "";
}

// --- List rendering ---
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
      set(location, newValue);
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
    const location = ref(shoppingListInDB, itemId);
    remove(location)
      .then(() => li.remove())
      .catch((err) => console.error("Error deleting:", err));
  });

  li.appendChild(del);
};

const appendList = (inputValue, itemId, shoppingListInDB) => {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.style.margin = "1rem 1rem";

  const textSpan = addTextSpan(li, inputValue);
  addEditIcon(li, textSpan, itemId, shoppingListInDB);
  addDeleteIcon(li, itemId, shoppingListInDB);

  listItem.appendChild(li);
};
