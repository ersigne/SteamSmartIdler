/** @typedef {import('../types/types').SteamAccount} SteamAccount */

const SteamUser = require("steam-user");
const SteamTotp = require('steam-totp');
const SteamStore = require('steamstore');

const Utils = require('./Utils');

class SteamSmartIdler {
    /**
     * Creates a new instance of SteamIdler
     * @param {SteamAccount} account - Steam Account
     * @param {Number[]} freeLicenses - SubID's of free Steam Limited Time Free to Keep packages
     */
    constructor(account, freeLicenses) {
        this.username = account.username;
        this.password = account.password;
        this.shared_secret = account.shared_secret;
        this.limited = account.limited;
        this.status = account.status;
        this.limitedGames = account.limited_games;
        this.games = account.games;
        this.playtime = account.playtime;
        this.freeLicenses = freeLicenses;
        this.sessionID = null;
        this.cookies = null;
        this.client = new SteamUser();
        this.store = new SteamStore();
        this.toIdle = Utils.getRandomGamesToPlay(this.games);
        this.timetable = Utils.getRandomTimeTable(this.playtime[0], this.playtime[1], this.playtime[2], this.playtime[3]);
        this.isPlaying = false;
        this.isConnected = false;
        this.defaultCurrency = "€";
    }

    #setStartupEvents() {
        this.client.on('error', (err) => console.error(`${this.username} - Error: ${err?.message}`));
        this.client.on('wallet', (hasWallet, currency, balance) => {
            if (hasWallet) console.log(`${this.username} - Wallet Funds: ${SteamUser.formatCurrency(balance, currency)}`);
            else console.log(`${this.username} - Wallet Funds: 0,00${this.defaultCurrency}`);
        });
        this.client.on('licenses', (licenses) => {
            // Removes already owned packages from the list of free licenses to redeem
            licenses.forEach((license) => {
                if (this.freeLicenses.includes(license.package_id)) this.freeLicenses.splice(this.freeLicenses.indexOf(license.package_id), 1);
            });
        });
    }

    #setDefaultEvents() {
        this.client.on('disconnected', (eresult, msg) => {
            this.isConnected = false;
            console.error(`${this.username} - Disconnected. Error: ${msg}`);
        });
        this.client.on('loggedOn', (details, parental) => {
            this.isConnected = true;
            console.log(`${this.username} - Reconnected`);
        });
    }

    async #waitForLoggedOn() {
        return new Promise((resolve, reject) => {
            this.client.once('loggedOn', async () => {
                console.log(`${this.username} - Logged in`);
                await this.client.setPersona(this.status);
                this.isConnected = true;
                resolve();
            });
            this.client.once('error', (err) => reject(err));
        })
    }

    async #waitForWebSession() {
        return new Promise((resolve, reject) => {
            this.client.once('webSession', (sessionID, cookies) => {
                this.sessionID = sessionID;
                this.cookies = cookies;
                this.store.setCookies(this.cookies);
                resolve();
            });
            this.client.once('error', (err) => reject(err));
        })
    }

    async #login() {
        if (this.shared_secret) this.client.logOn({ accountName: this.username, password: this.password, twoFactorCode: SteamTotp.generateAuthCode(this.shared_secret)});
        else this.client.logOn({ accountName: this.username, password: this.password });
        
        try { 
            await this.#waitForLoggedOn();
        }
        catch (error) { 
            console.error(`${this.username} - Login error: ${error?.message}`); 
            process.exit(-1); 
        }

        try {
            await this.#waitForWebSession();
        }
        catch (error) { 
            console.error(`${this.username} - WebSession error: ${error?.message}`); 
            process.exit(-1); 
        }
    }

    #addFreeLicenses() {
        for (const subID of this.freeLicenses) {
            this.store.addFreeLicense(subID, (err) => {
                if (err) console.error(`${this.username} - Add Free License error: ${err}`);
                else console.log(`${this.username} - Added Free License`);
            });
        }
    }

    async updateGameStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        //console.log(`Current Time -> ${currentHour}:${currentMinute}`);
        if (this.isConnected) {
            const isWithinPlayTime =
                (currentHour > this.timetable[0] || (currentHour === this.timetable[0] && currentMinute >= this.timetable[1])) &&
                (currentHour < this.timetable[2] || (currentHour === this.timetable[2] && currentMinute < this.timetable[3]));

            if (isWithinPlayTime && !this.isPlaying) {
                // Start playing if inside the playtime
                //console.log(`${this.username} - Gaming Session started. Playing <${this.toIdle}>`);
                this.isPlaying = true;
                await this.client.gamesPlayed(this.toIdle);
                
            } else if (!isWithinPlayTime && this.isPlaying) {
                // Stop playing if outside the playtime
                await this.client.gamesPlayed([]);
                this.isPlaying = false;
                this.timetable = Utils.getRandomTimeTable(this.playtime[0], this.playtime[1], this.playtime[2], this.playtime[3]);
                this.toIdle = Utils.getRandomGamesToPlay(this.games);
                //console.log(`${this.username} - Gaming Session ended, waiting for the next session.`);
            }
        }
    }

    async #idle() {
        if (!this.limited) {
            await this.client.gamesPlayed(this.limitedGames);
            //console.log(`${this.username} - Games to play next: <${this.limitedGames}>`);
        } else {
            Utils.printTimeTable(this.username, this.timetable);
            //console.log(`${this.username} - Games to play next: <${this.toIdle}>`);
            setInterval(async () => {
                await this.updateGameStatus();
            }, 30 * 1000); // Runs every 30 seconds
        }
    }

    async start() {
        this.#setStartupEvents();
        await this.#login();
        this.#setDefaultEvents();
        await this.#addFreeLicenses();
        await this.#idle();
    }
}

module.exports = SteamSmartIdler;