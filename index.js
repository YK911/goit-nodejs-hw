const argv = require("yargs").argv;
const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
} = require("./contacts");

// TODO: рефакторить
function invokeAction({ action, id, name, email, phone }) {
  switch (action) {
    case 'list':
      console.table(listContacts())
      break;

    case 'get':
      console.log(getContactById(id))
      break;

    case 'add':
      addContact(name, email, phone)
      break;

    case 'remove':
      removeContact(id)
      break;

    default:
      console.warn('\x1B[31m Unknown action type!');
  }
}

invokeAction(argv);
