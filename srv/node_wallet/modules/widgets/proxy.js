const request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')

const getData = ({ url }) => {
    return new Promise((resolve, reject) => {
        const customHeaders = {
            'Referer': url,
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        }
        const requestOptions = {
            url: url,
            headers: customHeaders
        }
        request(requestOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const dom = new JSDOM(body)
                const document = dom.window.document

                const baseTag = document.createElement("base")
                baseTag.target = "_blank"
                baseTag.href = 'https://api-dev.sinum.io/widgets/proxy/?url='+requestOptions.url
                document.head.insertAdjacentHTML("beforebegin", baseTag.outerHTML)

                //For https://www.coindesk.com/
                const elementToRemove = document.querySelector(".high-impact-ad");
                if (elementToRemove) {
                    elementToRemove.remove()
                }

                resolve(dom.serialize())
            } else {
                console.log("err", error)
            }
        })
    })
}

app.server.initRoutes({
    '/widgets/proxy': {
        'get': {
            func(data, auth, query, params) {
                return getData(query)
            }
        }
    }
})