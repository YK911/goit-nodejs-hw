const { Router } = require('express');
const {
  listContacts,
  getContactById,
  validateContactsData,
  validateId,
  addContact,
  removeContact,
  updateContact,
} = require('./controllers');

const router = Router();

router.get('/', listContacts);
router.get('/:id', validateId, getContactById);
router.post('/add', addContact);
router.delete('/remove/:id', validateId, removeContact);
router.patch('/:id', validateId, validateContactsData, updateContact);

module.exports = router;