const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const Sentry = require('@sentry/node')

Sentry.init({
    dsn: 'https://a30fc850351a4724904a03c9f5ebac2e@o4504802128101376.ingest.sentry.io/4504921381142528',
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    release: app.config.version
})

let srv = express()
srv.use(bodyParser.json({limit: '50mb', extended: true}))
srv.use(bodyParser.urlencoded({ extended: true }))
srv.use(express.static('public')); 

srv.use((req, res, next) => {
    req.auth = {}

    if (req.headers['authorization']) {
        req.auth.id = req.headers['authorization']
    }

    next()
})

srv.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
    res.header('Access-Control-Allow-Credentials', 'true')
    next()
})

let initCounter = 0
app.emitter.on('init', () => {
    initCounter++

    if (initCounter >= 4) {
        let server = http.createServer(srv)

        server.listen(app.config.server.rest.port, function (err) {
            if (err) {
                return app.logger.error('REST Server: failed to start', err)
            }

            app.logger.info('REST Server: started on port '+app.config.server.rest.port)
        })
    }
})

let routes = {}

app.emitter.on('start', () => {
    for(let route in routes) {
        for(let method in routes[route]) {
            srv[method](route, (req, res) => {
                req.route = route

                app.logger.debug('Method:', method, route)
                app.logger.debug('Body:', req.body)
                app.logger.debug('Auth:', req.auth)
                app.logger.debug('Query:', req.query)
                app.logger.debug('Params:', req.params)

                const transaction = Sentry.startTransaction({
                    name: method+' '+route,
                    op: method+' '+route,
                    sampled: true,
                    data: {
                        body: req.body,
                        auth: req.auth,
                        query: req.query,
                        params: req.params
                    }
                })

                let ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.connection.remoteAddress ? req.connection.remoteAddress.split('::ffff:').join('') : '')

                app.logger.debug('IP: ', ip)

                req.body._ip = ip

                let process = function(route, method, req, res, transaction) {
                    routes[route][method].func(req.body, req.auth, req.query, req.params)
                        .then(result => {
                            if (routes[route][method].resolve) {
                                let resolveFunc = function(i, resolveFuncs, result) {
                                    if (routes[route][method].resolve[i]) {
                                        routes[route][method].resolve[i](req, res, result)
                                            .then(result => {
                                                resolveFunc(i+1, resolveFuncs, result)
                                            })
                                    } else {
                                        app.social.addPoints(req, res, method, route, result)

                                        app.logger.debug('Response: ', {
                                            status: 200,
                                            data: result
                                        })
                                        res.send({
                                            status: 200,
                                            data: result
                                        })
                                        transaction.finish()
                                    }
                                }

                                resolveFunc(0, routes[route][method].resolve, result)
                            } else {
                                app.social.addPoints(req, res, method, route, result)

                                app.logger.debug('Response: ', result._plain || {
                                    status: 200,
                                    data: result
                                })
                                res.send(result._plain || {
                                    status: 200,
                                    data: result
                                })
                                transaction.finish()
                            }
                        })
                        .catch((err) => {
                            if (!err.error) {
                                app.logger.error('Error', err)
                            }

                            const {error, code} = err

                            app.logger.debug('Response: ', {
                                status: 400,
                                error,
                                code
                            })
                            res.send({
                                status: 400,
                                error,
                                code
                            })
                            Sentry.captureException(error ? new Error(error) : err, {
                                tags: {
                                    method: method+' '+route,
                                    body: JSON.stringify(req.body),
                                    query: JSON.stringify(req.query),
                                    params: JSON.stringify(req.params),
                                    fromURL: req.originalUrl,
                                    status: 400,
                                    error,
                                    code
                                }
                            })
                            transaction.finish()
                        })
                }

                if (routes[route][method].type && routes[route][method].type.indexOf('auth') !== -1) {
                    if (!req.auth || !req.auth.id) {
                        app.logger.debug('Response: ', {
                            status: 403,
                            error: 'Forbidden'
                        })
                        return res.send({
                            status: 403,
                            error: 'Forbidden',
                            code: 1000
                        })
                    }
                }

                process(route, method, req, res, transaction)
            })
        }
    }

    srv.get('*', function(req, res) {
        res.send({
            status: 404,
            error: 'Method not found',
            code: 1001
        })
    })

    srv.post('*', function(req, res) {
        res.send({
            status: 404,
            error: 'Method not found',
            code: 1001
        })
    })

    srv.put('*', function(req, res) {
        res.send({
            status: 404,
            error: 'Method not found',
            code: 1001
        })
    })

    srv.delete('*', function(req, res) {
        res.send({
            status: 404,
            error: 'Method not found',
            code: 1001
        })
    })
})

const initRoutes = conf => {
    for(let path in conf) {
        if (!conf.hasOwnProperty(path)) {
            continue;
        }

        let route = conf[path]

        if (routes[path] === undefined) {
            routes[path] = {}
        }

        for (let method in route) {
            if (!route.hasOwnProperty(method)) {
                continue
            }

            if (routes[path][method] === undefined) {
                routes[path][method] = {}
            }

            if (route[method].func !== undefined) {
                routes[path][method].func = route[method].func
            }

            if (route[method].type !== undefined) {
                routes[path][method].type = route[method].type
            }

            if (route[method].proxy !== undefined) {
                routes[path][method].proxy = route[method].proxy
            }

            if (route[method].resolve !== undefined) {
                if (!Array.isArray(route[method].resolve)) {
                    route[method].resolve = [route[method].resolve]
                }

                if (routes[path][method].resolve === undefined) {
                    routes[path][method].resolve = []
                }

                for(let i=0, l=route[method].resolve.length; i<l; i++) {
                    routes[path][method].resolve.push(route[method].resolve[i])
                }
            }
        }
    }
}

module.exports = {
    initRoutes
}
