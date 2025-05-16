const fs = require('fs');
const SteamSmartIdler = require('./SteamSmartIdler/SteamSmartIdler');

// Config
const accounts = JSON.parse(fs.readFileSync('./config.json', 'utf8')).accounts;

const SSI = new SteamSmartIdler(accounts, [], [], true);
SSI.run();