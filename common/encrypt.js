const bcrypt = require('bcrypt');

const getHash = module.exports.getHash = async (plain_text) => 
    await bcrypt.hash(plain_text, 12);

const compare = module.exports.compare = (plain_text, encrypted_text) =>
    bcrypt.compareSync(plain_text, encrypted_text);