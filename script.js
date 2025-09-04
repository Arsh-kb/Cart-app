import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// Database URL
const appSettings = {
  databaseURL:
    "https://shopping-cart-d2963-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Connecting firebase to database
const app = initializeApp(appSettings);
const database = getDatabase(app);
const shoppingListInDB = ref(database, "data");
// console.log(app);

const inputFieldEl = document.querySelector("#input-field");
const addButton = document.getElementById("add-button");
const listItem = document.querySelector("#shopping-list");

// Add Shopping Items
// const appendList = (inputValue) => {
//     listItem.innerHTML += `<li>${inputValue}</li>`;
// };

// Create and append text span
const addTextSpan = (li, textValue) => {
  const span = document.createElement("span");
  span.innerText = textValue;
  li.appendChild(span);
  span.style.flexGrow = 5;
  span.style.textAlign = "left";
  span.style.paddingLeft = "1rem";
};

// Create and append edit icon
const addEditIcon = (li, textSpan, itemId) => {
  const edit = document.createElement("span");
  edit.innerText = "🪶";
  edit.classList.add("edit");
  edit.style.marginRight = "0.5rem";
  edit.style.textAlign = "right";

  edit.addEventListener("click", () => {
    const newValue = prompt("Edit item:", textSpan.innerText);
    if (newValue && newValue.trim() !== "") {
      textSpan.innerText = newValue;
      let location = ref(database, `data/${itemId}`);
      set(location, { item: newValue });
    }
  });

  li.appendChild(edit);
};

// Create and append delete icon
const addDeleteIcon = (li, itemId) => {
  const del = document.createElement("span");
  del.innerText = "🗑️";
  del.classList.add("delete");

  del.addEventListener("click", () => {
    let location = ref(database, `data/${itemId}`);
    remove(location)
      .then(() => {
        li.remove();
      })
      .catch((err) => console.error("Error deleting:", err));
  });

  li.appendChild(del);
};

// Adding List Element
const appendList = (inputValue,itemId) => {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.justifyContent = "space-between";
  li.style.margin = "1rem 1rem";

  addTextSpan(li, inputValue);
  const textSpan = li.querySelector("span");
  addEditIcon(li, textSpan, itemId);
  addDeleteIcon(li,itemId);

  listItem.appendChild(li);
};

// printing input text
addButton.addEventListener("click", (e) => {
  e.preventDefault(); // prevents refreshing on pressing form button
  let inputValue = inputFieldEl.value;
  if (inputValue.trim() === "") return;
  push(shoppingListInDB, { item: inputValue });
  clearListInput(inputValue);
  // alert(`${inputValue} added to database`);
});

// Storing elements as key-value pair (objects)
onValue(shoppingListInDB, function (snapshot) {
  clearList(listItem);
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val());
    for (let item of itemsArray) {
      appendList(item[1].item,item[0]);
    }
  }
});

function clearList(listItem) {
  listItem.innerHTML = "";
}

function clearListInput() {
  inputFieldEl.value = "";
}
