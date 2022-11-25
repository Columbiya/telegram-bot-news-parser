import cherio from "cherio"
import chalk from "chalk"
import { getPageContent } from "./helpers/puppeteer.js"
import TelegramBot from "node-telegram-bot-api"
import dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config()

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true})

const chatId = -1001589699434

const WEB_SITE = 'https://vegetarian.ru/news/'
const titleSelector = 'header.post-title.entry-header'
const descriptionSelector = 'div.post-content.entry-content.small'
const articleSelector = 'article.post.style2:first-child'
const linkSelector = `${titleSelector} a`
const jsonFile = 'data.json'

const main = async () => {
    try {
        const pageContent = await getPageContent(WEB_SITE)
        const $ = cherio.load(pageContent)

        const articleDiv = $(articleSelector)

        const title = articleDiv.find(titleSelector)
        const description = articleDiv.find(descriptionSelector)
        const link = articleDiv.find(linkSelector)

        const titleText = title.text().trim()
        const descriptiontext = description.text().trim()
        const linkHref = `${WEB_SITE.split('/news/')[0]}${link.attr('href')}`

        const rawdata = fs.readFileSync(jsonFile)
        const data = JSON.parse(rawdata)
        const lastArticle = data[data.length ? data.length - 1: 0]

        if (!lastArticle || lastArticle.title != titleText) {
            data.push({ title: titleText, description: descriptiontext, link: linkHref })
            fs.writeFileSync(jsonFile, JSON.stringify(data))

            bot.sendMessage(chatId, `${titleText.trim()}\n\n${descriptiontext.trim()}\n\nSource: ${linkHref.trim()}`)
        }

    } catch(e) {
        console.log(chalk.red(`An error has occured \n`))
        console.log(e)
    }
}

setInterval(main, 1000 * 60 * 10)