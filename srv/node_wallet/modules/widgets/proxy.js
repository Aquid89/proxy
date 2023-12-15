const request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')

const getData = ({ url }) => {
    return new Promise((resolve, reject) => {
        const customHeaders = {

        };

        // Формируем параметры запроса, включая новые заголовки
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
                baseTag.href = requestOptions.url
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

        // const requestOptions = {
        //     url:url,
        // }; 
        // request(requestOptions, (error, response, body) => {
        //     if (!error && response.statusCode === 200) {

        //         // const dom = new JSDOM(body);
        //         // const document = dom.window.document

        //         // const baseTag = document.createElement('base')
        //         // baseTag.target = '_blank';
        //         // baseTag.href = requestOptions.url

        //         // document.head.insertAdjacentHTML('beforebegin', baseTag.outerHTML)

        //         //For https://www.coindesk.com/
        //         // const elementToRemove = document.querySelector('.high-impact-ad')
        //         // if (elementToRemove) {
        //         //     elementToRemove.remove()
        //         // }
        //         resolve(response)

        //         //query.send(body);
        //     }
        // })
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