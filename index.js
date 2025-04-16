const fs = require('fs');
const SteamSmartIdler = require('./SteamSmartIdler/classes/SteamSmartIdler');

// Config
const accounts = JSON.parse(fs.readFileSync('./config.json', 'utf8')).accounts;
let delayBetweenLoginsinSeconds = -1; // {-1} - Sets a Random Sleep Timer between 1-5 seconds

run();

async function run() {
    console.clear();
    for (const [index, account] of Object.entries(accounts)) {
        const idler = new SteamSmartIdler(account, [1261257]);
        idler.start();

        if (index < Object.keys(accounts).length - 1) {
            delayBetweenLoginsinSeconds = delayBetweenLoginsinSeconds === -1 ? (Math.floor(Math.random() * 5) + 1) : delayBetweenLoginsinSeconds;
            await new Promise(resolve => setTimeout(resolve, delayBetweenLoginsinSeconds * 1000));
        }
    }
}