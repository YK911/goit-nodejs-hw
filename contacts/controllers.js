const Contact = require('../models/contact')
const {Types: { ObjectId }} = require('mongoose');
const Joi = require("joi");

async function listContacts(req, res, next) {
  try {
    const pageOptions = {
      page: req.query.page || 1,
      limit: req.query.limit || 2,
      sort: { name: 1 }
    };
    const result = await contactModel.paginate({}, pageOptions); 
    res.status(200).json(result.docs);
  } catch (err) {
    next(err);
  }
}

async function getContactById(req, res, next) {
  const { id } = req.params;
  try {
    const searchedContact = await Contact.findById(id);
    searchedContact
      ? res.status(200).json(searchedContact)
      : res.status(404).send();
  } catch (err) {
    next(err);
  }
}

function validateContactsData(req, res, next) {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({ message: 'missing fields' });
  }

  const schema = Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email({ minDomainAtoms: 2 }),
    phone: Joi.string().regex(/^[0-9\- ]{10,20}$/)
  });

  const { error, value } = Joi.validate(req.body, schema);
  error ? res.status(400).json({ message: error.details[0].message }) : next();
}

function validateId(req, res, next) {
  const { id } = req.params;
  ObjectId.isValid(id) ? next() : res.status(400).send();
}


async function addContact(req, res, next) {
  try {
    const newContact = new Contact(req.body);
    await newContact.save((err, savedContact) => {
      err
        ? res.status(400).json(err.message)
        : res.status(201).json(savedContact);
    });
  } catch (err) {
    next(err);
  }
}

async function removeContact(req, res, next) {
  const { id } = req.params;
  try {
    const targetContact = await Contact.findByIdAndDelete(id);
    targetContact ? res.status(204).send() : res.status(404).send();
  } catch (err) {
    next(err);
  }
}

async function updateContact(req, res, next) {
  const { id } = req.params;
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    updatedContact
      ? res.status(200).json(updatedContact)
      : res.status(404).send();
  } catch (err) {
    next(err);
  }
}


module.exports = {
  listContacts,
  getContactById,
  validateContactsData,
  validateId,
  addContact,
  removeContact,
  updateContact,
};
