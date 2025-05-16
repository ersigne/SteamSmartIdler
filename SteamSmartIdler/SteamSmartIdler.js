const Idler = require('./classes/Idler');
const Requester = require('./classes/Requester');

class SteamSmartIdler {
    constructor(accounts, freeLicenses = [], freePointsShopItems = [], autoRedeemFreePromotions = false) {
        this.accounts = accounts;
        this.freeLicenses = freeLicenses;
        this.freePointsShopItems = freePointsShopItems;
        this.autoRedeemFreePromotions = autoRedeemFreePromotions;
        this.delayBetweenLoginsinSeconds = -1;
        this.idlers = [];
    }

    async run() {
        process.title = "SteamSmartIdler by @ersigne";
        console.clear();
        if (this.autoRedeemFreePromotions) {
            console.log('Fetching Free To Keep Games and Free Points Shop Items...');
            await this.#fetchAndSetFreePromotions();
            await this.#fetchAndSetFreePointsShopItems();
        }
        
        for (const [index, account] of Object.entries(this.accounts)) {
            const idler = new Idler(account, [...this.freeLicenses], [...this.freePointsShopItems]);
            this.idlers.push(idler);
            idler.start();

            if (index < Object.keys(this.accounts).length - 1) {
                this.delayBetweenLoginsinSeconds = this.delayBetweenLoginsinSeconds === -1 ? (Math.floor(Math.random() * 5) + 1) : this.delayBetweenLoginsinSeconds;
                await new Promise(resolve => setTimeout(resolve, this.delayBetweenLoginsinSeconds * 1000));
            }
        }

        if (this.autoRedeemFreePromotions) {
            setInterval(async () => {
                this.freeLicenses = [];
                this.freePointsShopItems = [];
                await this.#fetchAndSetFreePromotions();
                await this.#fetchAndSetFreePointsShopItems();
                for (const idler of this.idlers) {
                    let idlerLicenses = [...this.freeLicenses];
                    // Free Licenses
                    if (idler.ownedLicenses) this.freeLicenses.forEach((SubID) => {
                        if (idler.ownedLicenses.includes(SubID)) idlerLicenses.splice(idlerLicenses.indexOf(SubID), 1);
                    });
                    if (idlerLicenses.length) await idler.addFreeLicenses(idlerLicenses);
                    // Free points shop items
                    if (this.freePointsShopItems.length) await idler.addFreeSteamPointsShopItems([...this.freePointsShopItems], idler.access_token, idler.cookies);
                }
            }, 60 * 60 * 24 * 1000); // Runs every 24h
        }
    }

    async #fetchAndSetFreePromotions() {
        const freeGames = await Requester.fetchFreeSteamGames();
        Object.values(freeGames).forEach((SubID) => this.freeLicenses.push(SubID));
    }

    async #fetchAndSetFreePointsShopItems() {
        const freePointsShopItems = await Requester.fetchFreePointsShopItems();
        freePointsShopItems.forEach(item => this.freePointsShopItems.push(item.defid));
    }
}

module.exports = SteamSmartIdler;