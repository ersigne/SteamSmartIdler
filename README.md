# SteamSmartIdler
A Steam Smart Idler that simulates playtime and favourite games, redeems free promotions &amp; points shop items automatically and more.

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
* [Features](#features)
* [Contributing](#contributing)
* [License](#license)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ersigne/SteamSmartIdler.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd SteamSmartIdler
    ```
3.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
4.  Create a `config.json` file in the main directory:
    ```json
    # Example config.json file - [ DELETE ALL THE COMMENTS BEFORE USING ]
    {
    "accounts": [
        {
            "username": "STEAMLOGINUSERNAME1", 
            "password": "STEAMLOGINPASSWORD1", 
            "shared_secret": "STEAMSHAREDSECRET1", 
            "limited": false, # Set to false if you want to idle the 'limited_games' AppID's 24/7, else set to true if you want to idle the 'games' AppID's based on simulated daily session/s
            "status": 1, # Steam Profile Status (0 - Offline, 1 - Online, 2 - Busy, 3 - Away, 4 - Snooze, 5 - LookingToTrade, 6 - LookingToPlay, 7 - Invisible)
            "limited_games": [ 730 ], # List of AppID's to play when 'limited' is false
            "games": [ 730, 440, 761890, 582660, 2507950, 220, 2073850 ], # List of AppID's to play when 'limited' is true
            "playtime": [ 1, 2, 0, 10] # Playtime for this account, [ Session Min Hours, Session Max Hours, Session Min Minutes(0-60), Session Max Minutes(0-60) ]. This plays a minimum of 1 hours and a maximum of 2 hours and 10 Minutes
        },
        {
            "username": "STEAMLOGINUSERNAME2", 
            "password": "STEAMLOGINPASSWORD2", 
            "shared_secret": "STEAMSHAREDSECRET2", 
            "limited": true,
            "status": 7,
            "limited_games": [ 730 ],
            "games": [ 730, 440, 761890, 582660, 2507950, 220, 2073850 ],
            "playtime": [ 2, 4, 0, 10] # This plays a minimum of 2 hours and a maximum of 4 hours and 10 Minutes
        }]
    }
    ```

## Usage

1. Create a new `index.js` or use the one provided
```js
    # Example index.js
    const fs = require('fs');
    const SteamSmartIdler = require('./SteamSmartIdler/classes/SteamSmartIdler');
    
    // Config
    const accounts = JSON.parse(fs.readFileSync('./config.json', 'utf8')).accounts;
    let delayBetweenLoginsinSeconds = -1; // {-1} - Sets a Random Sleep Timer between 1-5 seconds
    
    async function run() {
        console.clear();
        for (const [index, account] of Object.entries(accounts)) {
            // Create a new SteamSmartidler passing to it an account and a list of Free Promotion Packages SubIDs - See https://steamdb.info/upcoming/free/
            const idler = new SteamSmartIdler(account, [1261257]);
            idler.start();
            
            // Sleep after each login for a random time between 1-5 seconds if delayBetweenLoginsinSeconds is set to -1 or sleep delayBetweenLoginsinSeconds seconds.
            if (index < Object.keys(accounts).length - 1) {
                delayBetweenLoginsinSeconds = delayBetweenLoginsinSeconds === -1 ? (Math.floor(Math.random() * 5) + 1) : delayBetweenLoginsinSeconds;
                await new Promise(resolve => setTimeout(resolve, delayBetweenLoginsinSeconds * 1000));
            }
        }
    }
    
    run();
    
```
