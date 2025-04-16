# SteamSmartIdler
A Steam Smart Idler that simulates playtime and favourite games, redeems free promotions &amp; points shop items automatically and more.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_v3-blueviolet.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Last Commit](https://img.shields.io/github/last-commit/ersigne/SteamSmartIdler)](https://github.com/ersigne/SteamSmartIdler/commits/main)
[![Open Issues](https://img.shields.io/github/issues-raw/ersigne/SteamSmartIdler)](https://github.com/ersigne/SteamSmartIdler/issues)
[![Static Badge](https://img.shields.io/badge/Paypal-00457C?style=flat&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/ersignee)



## 📜・Table of Contents
* [Installation](#%EF%B8%8Finstallation)
* [Usage](#usage)
* [Features](#features)
* [Contributing](#contributing)
* [License](#%EF%B8%8Flicense)
* [Documentation](#documentation)

## ⚙️・Installation
1.  Clone the repository:

    ```bash
    git clone https://github.com/ersigne/SteamSmartIdler.git
    ```
3.  Navigate to the project directory:

    ```bash
    cd SteamSmartIdler
    ```
4.  Install dependencies:

    ```bash
    npm install
    ```
5.  Create a `config.json` file in the main directory following the example below:

    ```json
    {
    "accounts": [
        {
            "username": "STEAMLOGINUSERNAME1", 
            "password": "STEAMLOGINPASSWORD1", 
            "shared_secret": "STEAMSHAREDSECRET1", 
            "limited": false,
            "status": 1,
            "limited_games": [ 730 ],
            "games": [ 730, 440, 761890, 582660, 2507950, 220, 2073850 ],
            "playtime": [ 1, 2, 0, 10]
        },
        {
            "username": "STEAMLOGINUSERNAME2", 
            "password": "STEAMLOGINPASSWORD2", 
            "shared_secret": "STEAMSHAREDSECRET2", 
            "limited": true,
            "status": 7,
            "limited_games": [ 730 ],
            "games": [ 730, 440, 761890, 582660, 2507950, 220, 2073850 ],
            "playtime": [ 2, 4, 0, 10]
        }]
    }
    ```
    * **username** - The account username you use during steam login
    * **password** - The account password you use during steam login
    * **shared_secret** - The account shared secret. Check [here](docs/shared-secret.md) how to get it
    * **limited** - Set to false if you want to idle the 'limited_games' AppID's 24/7, else set to true if you want to idle the 'games' AppID's based on simulated sessions
    * **status** - Steam Profile Status (0 - Offline, 1 - Online, 2 - Busy, 3 - Away, 4 - Snooze, 5 - LookingToTrade, 6 - LookingToPlay, 7 - Invisible)
    * **limited_games** - List of AppID's to play when 'limited' is false
    * **games** - List of AppID's to play when 'limited' is true
    * **playtime** - Session playtime for this account, in the format `[ Min Hours, Max Hours, Min Minutes(0-60), Max Minutes(0-60) ]`. The example value `[ 2, 4, 0, 10]` plays a minimum of 2 hours and a maximum of 4 hours and 10 Minutes each session

## 🚀・Usage
1. Create a new `index.js` or use the one provided below:

```js
    // Example index.js
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

## 🔥・Features
* **Simulates Playtime:** Allows you to simulate playtime for your favorite Steam games, potentially increasing your playtime hours as desired.
* **Multi-Account Support:** Capable of managing and idling multiple Steam accounts simultaneously.
* **Customizable Playtime Sessions:** Offers configurable playtime sessions with adjustable minimum and maximum hours and minutes per session for each account.
* **Selective Game Idling:** Allows you to specify different lists of games to idle when randomly selected.
* **Redeems Free Promotions:** Automatically redeems free promotions SubID's you set for each account, saving you the effort of manually claiming them.

## 🤝・Contributing
We welcome contributions to the SteamSmartIdler project! If you'd like to help out, please follow these guidelines:

1.  **Fork the Repository:** Click the "Fork" button at the top right of the repository page on GitHub (or your chosen platform). This will create a copy of the project under your own account.

2.  **Create a New Branch:** Before making any changes, create a new branch from the `main` branch. This helps keep your contributions organized and separate from the main codebase.

    ```bash
    git checkout -b feature/your-new-feature
    # or
    git checkout -b bugfix/your-bug-fix
    ```

    Replace `feature/your-new-feature` or `bugfix/your-bug-fix` with a descriptive name for your branch.

3.  **Make Your Changes:** Implement your desired features, bug fixes, or improvements. Please adhere to any existing code style and conventions within the project.

4.  **Commit Your Changes:** Once you've made your changes, commit them with clear and concise commit messages. Follow best practices for writing commit messages (e.g., a short summary in the first line, followed by a more detailed explanation if necessary).

    ```bash
    git add .
    git commit -m "Implement [brief description of feature]"
    # or
    git commit -m "Fix [brief description of bug]"
    ```

5.  **Push to Your Fork:** Push your local branch to your forked repository on GitHub (or your platform).

    ```bash
    git push origin feature/your-new-feature
    ```

    Replace `feature/your-new-feature` with the name of your branch.

6. **Create a Pull Request (PR):**
  * Go to the main repository page on GitHub (the `SteamSmartIdler` repository).
  * Click the "Pull requests" tab.
  * Click the "New pull request" button.
  * Select your forked repository and the branch you just pushed as the "compare branch."
  * Ensure the base branch is correctly set to the `main` branch of the main repository.
  * Provide a clear title and a detailed description of your changes in the pull request. Explain the problem you're solving or the feature you're adding.
  * Click the "Create pull request" button.

7. **Code Review:** Your pull request will be reviewed by the project maintainers. They may provide feedback or request changes. Please be responsive to any comments and make the necessary adjustments.

8. **Merge:** Once your pull request is approved, it will be merged into the main codebase. Congratulations on your contribution!

## ⚖️・License
This project is licensed under the terms of the ***GNU Affero General Public License v3.0*** - see the [LICENSE](LICENSE) file for details.

## 📚・Documentation
* [How to obtain a Shared Secret](docs/shared-secret.md)