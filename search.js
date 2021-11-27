require('dotenv').config()
const debug = require('debug')('app:cards')
const { open } = require('sqlite')
const sqlite3  = require('sqlite3')

const Nightmare = require('nightmare')

const sleep = ms => new Promise( (resolve, ) => {
    setTimeout(resolve, ms)
})

const get_nightmare = () => {
    return new Nightmare({
        show: 'CARDS_BROWSER_SHOW' in process.env
    })
}

class UnitPrice {
    constructor(avg_str, min_str, max_str) {
        this.avg = this.str_to_cents(avg_str)
        this.min = this.str_to_cents(min_str)
        this.max = this.str_to_cents(max_str)
    }

    str_to_cents(price) {
        if (price === '--') {
            return null
        }
        price = price.replace('$', '')
        price = parseFloat(price)
        return price * 100
    }

    toString() {
        return `${this.avg/100} (min ${this.min/100}, max ${this.max/100})`
    }
}

class CardManager {
    constructor(db, nm) {
        this.db = db
        this.nm = nm
    }

    static async create() {
        const db = await open({
            filename: process.env['CARDS_DB'],
            driver: sqlite3.Database
        })

        const nm = new Nightmare({
            show: true
        })

        return new CardManager(db, nm)
    }

    async get_next() {
        return await this.db.get(`
            SELECT * FROM Cards
                WHERE unit_price_avg IS NULL AND unknown=0
        `)
    }

    get_url_for(card) {
        const encoded = encodeURIComponent(`${card.name} ${card.identifier}`)
        return `https://mavin.io/search?q=${encoded}`
    }


    async write_price(card, unit_price, url) {
        await this.db.run(`
            UPDATE Cards
                SET
                    unit_price_avg=?,
                    unit_price_min=?,
                    unit_price_max=?,
                    url=?
                WHERE name=? AND identifier=?
        `, [
            unit_price.avg,
            unit_price.min,
            unit_price.max,
            url,
            card.name,
            card.identifier
        ])
    }

    async write_unknown(card, url) {
        await this.db.run(`
            UPDATE Cards
                SET
                    unknown=1,
                    url=?
                WHERE name=? AND identifier=?
        `, [url, card.name, card.identifier])
    }

    __load_page(url) {
        return new Promise( (resolve, ) => {
            get_nightmare()
                .goto(url)
                .evaluate( () => {
                    const el = document.querySelector('a[href="#worth"] > h4')

                    if (!el || el.textContent === '--') {
                        return null
                    }

                    let el_min = document.querySelector('a#lowestWorthItemHeader' )
                    let el_max = document.querySelector('a#highestWorthItemHeader')

                    if (!el_min) {
                        el_min = el.textContent
                    } else {
                        el_min = el_min.dataset.sold
                    }
                    if (!el_max) {
                        el_max = el.textContent
                    } else {
                        el_max = el_max.dataset.sold
                    }

                    return [el.textContent, el_min, el_max]
                })
                .end()
                .then( price => resolve(price) )
        })
    }

    async get_price_for(card) {
        const url = this.get_url_for(card)


        debug(`Getting price for ${card.name} ${card.identifier}...`)
        const price_triplet = await this.__load_page(url)

        if (price_triplet) {
            const price = new UnitPrice(...price_triplet)

            debug(`Found price for ${card.name} ${card.identifier} to be ${price.toString()}`)
            await this.write_price(card, price, url)
        } else {
            debug(`Unable to find price for ${card.name} ${card.identifier}`)
            await this.write_unknown(card, url)
        }
    }

    async get_remaining_count() {
        const count = await this.db.get(`
            SELECT COUNT(*) FROM Cards
                WHERE unit_price_avg IS NULL AND unknown=0
        `)
        
        return count['COUNT(*)']
    }

    async get_all_prices() {
        while (true) {
            const remaining = await this.get_remaining_count()
            debug('remaining ', remaining)

            if (remaining === 0) {
                break
            }

            const card = await this.get_next()

            await this.get_price_for(card)

            await sleep(3000)
        }

        debug('complete!')
    }
}


const main = async () => {
    const cm = await CardManager.create()

    await cm.get_all_prices()

}

main()



