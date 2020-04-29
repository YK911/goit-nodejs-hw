const fs = require("fs");
const path = require("path");

const contactsPath = path.join(__dirname, "db", "contacts.json");

// TODO: задокументировать каждую функцию
function listContacts() {
  const contacts = fs.readFileSync(contactsPath, "utf-8", getData());
  const parsedContacts = JSON.parse(contacts);

  function getData(err, data) {
    if (err) {
      throw err;
    }

    return data;
  }

  return parsedContacts;
}

function getContactById(contactId) {
  const contacts = listContacts();

  const searchedContact = contacts.find((contact) => contact.id === contactId);

  //

  return searchedContact;
}

function removeContact(contactId) {
  const contacts = listContacts();

  const sortedContacts = JSON.stringify(
    contacts.filter((contact) => contact.id !== contactId)
  );

  fs.writeFile(contactsPath, sortedContacts, (err) => {
    if (err) {
      throw err;
    }

    console.log("Contact has been removed!");
  });
}

function addContact(name, email, phone) {
  const contacts = listContacts();

  const id = contacts.length + 1;
  const newContact = {
    id,
    name,
    email,
    phone,
  };

  const updatedContacts = [...contacts, newContact];

  const JSONFormData = JSON.stringify(updatedContacts);

  fs.writeFile(contactsPath, JSONFormData, (err) => {
    if (err) {
      throw err;
    }

    console.log("Contact has been added!");
  });
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
};
