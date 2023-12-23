const { timeToStringLocal } = require('./helpers')
const express = require('express')
const router = express.Router()
var request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')


const PdfPrinter = require('pdfmake');
const fs = require('fs');

const BigNumber = require('bignumber.js');

const Contract = require('./contract.js');
const QRCode = require('qrcode');
const path = require('path');

const arrowImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAOCAYAAAAWo42rAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACbSURBVHgB3ZDBDcIwDEW/0xwYI6PABGQDyhmxAqqAOwdEr3STdpQOQvjYEkVVRNV7LUVRnp9jy0AW9YXxrifnLgcJiE6wnRWnYlGiv1UMHgjHSrp/gu50/UronS8QpEBbX7nLJWMCtCtzDDzOLCl46qLLRGz01ie6N9EIsT+cpJGhepBB9KKTk/rLV7K8jFv9ZEuMJEwMH60g5x/PGDtSXn8O6gAAAABJRU5ErkJggg=='
const bgImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABN2lDQ1BBZG9iZSBSR0IgKDE5OTgpAAAokZWPv0rDUBSHvxtFxaFWCOLgcCdRUGzVwYxJW4ogWKtDkq1JQ5ViEm6uf/oQjm4dXNx9AidHwUHxCXwDxamDQ4QMBYvf9J3fORzOAaNi152GUYbzWKt205Gu58vZF2aYAoBOmKV2q3UAECdxxBjf7wiA10277jTG+38yH6ZKAyNguxtlIYgK0L/SqQYxBMygn2oQD4CpTto1EE9AqZf7G1AKcv8ASsr1fBBfgNlzPR+MOcAMcl8BTB1da4Bakg7UWe9Uy6plWdLuJkEkjweZjs4zuR+HiUoT1dFRF8jvA2AxH2w3HblWtay99X/+PRHX82Vun0cIQCw9F1lBeKEuf1UYO5PrYsdwGQ7vYXpUZLs3cLcBC7dFtlqF8hY8Dn8AwMZP/fNTP8gAAAAJcEhZcwAALiMAAC4jAXilP3YAAAUbaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0NSA3OS4xNjM0OTksIDIwMTgvMDgvMTMtMTY6NDA6MjIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMTItMjJUMDA6MTA6NDgrMDU6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMTItMjJUMDA6MTA6NDgrMDU6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTEyLTIyVDAwOjEwOjQ4KzA1OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyZmM2MDM0NC1jZDI5LTZmNDAtODY2NS1hOTQ0ZTQ4YTA0M2UiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MmZjNjAzNDQtY2QyOS02ZjQwLTg2NjUtYTk0NGU0OGEwNDNlIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MmZjNjAzNDQtY2QyOS02ZjQwLTg2NjUtYTk0NGU0OGEwNDNlIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iQWRvYmUgUkdCICgxOTk4KSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MmZjNjAzNDQtY2QyOS02ZjQwLTg2NjUtYTk0NGU0OGEwNDNlIiBzdEV2dDp3aGVuPSIyMDIzLTEyLTIyVDAwOjEwOjQ4KzA1OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+BJjedwAAAAxJREFUCJljuHPrMQAFLwKa7fvbdwAAAABJRU5ErkJggg=='
const logoImg = 'data:image/png;base64,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'

router.get("/proxy", cors(), (req, res) => {
  // console.log(req.query.url)
  // Определите новые заголовки, которые вы хотите добавить
  var customHeaders = {
    // 'Referer': 'http://localhost:3000/proxy/?url=https://mail.ru/',
    // 'Content-Type': 'text/javascript',
    // 'X-Content-Type-Options': 'nosniff;'
    // Другие заголовки...
  //  'Origin':'http://localhost:3000/proxy/?url=https://mail.ru/'
  };

  // Формируем параметры запроса, включая новые заголовки
  var requestOptions = {
    url: req.query.url,
    headers: customHeaders,
  };
  request(requestOptions, (error, response, body) => {
    console.log('asdasda', typeof req.query.url)
    if (!error && response.statusCode === 200) {
      const t = req.query.url
      if(!t.includes('.css')){
      const dom = new JSDOM(body);
      const document = dom.window.document;

      const elementsWithHttpsHref = document.querySelectorAll('[href^="https://"]');

// Изменяем атрибут href для каждого найденного элемента
elementsWithHttpsHref.forEach(element => {
  const currentHref = element.getAttribute('href');
  const newHref = currentHref.replace('https://', 'http://localhost:3000/proxy/?url=https://');
  element.setAttribute('href', newHref);
});

      // const linkElements = document.querySelectorAll('link[rel="stylesheet"]');

      // linkElements.forEach(linkElement => {
      //   const currentHref = linkElement.getAttribute('href');
      //   const newHref = currentHref.replace('https://', 'http://localhost:3000/proxy/?url=https://');
      //   linkElement.setAttribute('href', newHref);
      // });

      const baseTag = document.createElement("base");
      baseTag.target = "_blank";
      baseTag.href = requestOptions.url;
      document.head.insertAdjacentHTML("beforebegin", baseTag.outerHTML);

      //For https://www.coindesk.com/
      const elementToRemove = document.querySelector(".high-impact-ad");
      if (elementToRemove) {
        elementToRemove.remove();
      }
      console.log('1',response.headers['content-type'])
      res.setHeader('Content-Type', response.headers['content-type']);
   //   res.setHeader('Your-Header', 'Header-Value');
    //   Object.keys(response.headers).forEach(key => {
    //     const value = response.headers[key];
    //     if(key=='content-type'){
    //       res.setHeader('Content-Type', value);
    //     }
    //  //   console.log(`${key}, ${value}\n`);
    //   });

      res.send(dom.serialize());
    } else {
   //  res.setHeader('Content-Type', 'text/css');
   console.log('2', response.headers['content-type'])
   res.setHeader('Content-Type', response.headers['content-type']);
      // Object.keys(response.headers).forEach(key => {
      //   const value = response.headers[key];
      //   if(key=='content-type'){
      //     console.log('huy', key)
      //     res.setHeader('Content-Type', value);
      //   }
      // });
      res.send(body)
    }

    } else {
      console.log("err", error);
      res.send(error);
    }
  });
});

router.get('/generate', cors(), (req, res) => {
  const requestOptions = {
    url: 'https://api-dev.sinum.io/widgets/explorer/transaction-pdf/0x6e15500dee8ec125ff971afbf05bea535d069afe2fcaa1c24ab4e723991e3dbb?blockchain=ethereum',
  };
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let tx = JSON.parse(body).data;

      const timezone = '+5'

      const fonts = {
        Roboto: {
          normal: 'fonts/Roboto-Regular.ttf',
          bold: 'fonts/Roboto-Bold.ttf',

        }
      };

      const typeHeadings = {
        'approval': 'Token Approval Tx',
        'call': 'Call Transaction',
        'send-ether': 'ETH Transaction',
        'send-erc20-token': 'ERC20 Transaction',
        'deploy-contract': 'Contract Deploy Tx',
        'message': 'Message Tx ??',
        'swap': 'Swap Transaction',
        'nft-trade': 'NFT Trade Tx',
        'send-nft': 'NFT Transaction',
        'nft-mint': 'NFT Mint',
        'lend': 'Lend Tx',
        'redeem': 'Redeem Tx'
      }

      QRCode.toDataURL(`https://etherscan.io/tx/${tx.hash}`, { errorCorrectionLevel: 'L', width: 84 }, (err, qrCodeURL) => {
        if (err) {
          console.error('Error generating QR code:', err);
        }

        const printer = new PdfPrinter(fonts);

        const docDefinition = {
          pageSize: 'A4',
          pageMargins: [20, 10, 20, 20],
          styles: {
            hyperlink: {
              decoration: 'underline', 
              color: 'blue', 
              marginTop: 4,
              color: '#9483FF',
              alignment: 'center',
            },
            qrcode: {
              marginTop: -10,
              alignment: 'right',
              borderRadius: 5, 
            },
            tableStyle: {
              alignment: 'center', 
            },
          },
          content: [
            {
              margin: [0, 0, 0, 20],
              table: {
                widths: ['*', '*', '*'],
                body: [
                  [{
                    image: logoImg,
                    width: 75, // устанавливаем ширину изображения
                    height: 20,
                  }, {
                    text: 'explorer.sinum.app',
                    link: 'http://explorer.sinum.app',
                    style: 'hyperlink'
                  }, { image: qrCodeURL, style: 'qrcode' }],
                ]
              },
             
              layout: 'noBorders'
            },
            { text: makeUpperCase('Transaction receipt'), fontSize: 12, marginTop: -40},
            { text: makeUpperCase(typeHeadings[tx.type]), fontSize: 15, color:'#9483FF', marginTop:8},
            { text: timeToStringLocal(tx.timeStamp * 1000, timezone), fontSize: 10, marginTop:8},
            {image:bgImg,  width: 600,
                          height: 50, marginLeft: -20,  marginRight: -20, marginTop:20},
            {text: [
              { text: makeUpperCase('Transaction Hash\n'), color: '#442A8E', fontSize: 10, lineHeight:1.6}, // текст белого цвета
              { text: tx.hash, color: '#000', fontSize: 10 }, // текст белого цвета
            ], marginTop:-40, marginBottom:20},
            {
              table: {
                widths: [45, 500],
                body: [
                  [{ text: 'From', alignment: 'left' }, { text: tx.from, alignment: 'right', marginBottom:4 }],
                  [{ text: 'To' }, { text: tx.to, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Block' }, { text: tx.blockNumber, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Hash' }, { text: tx.hash, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Nonce' }, { text: tx.nonce, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Value' }, { text: tx.value, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Gas Used' }, { text: tx.gasUsed, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Gas Price' }, { text:  tx.gasPrice, alignment: 'right', marginBottom:4 }],
                  [{ text: 'Fee' }, { text: '?', alignment: 'right', marginBottom:4 }],

                 // ['Input', tx.input],
                ]
              },
              layout: 'noBorders',
              fontSize: 10
            },
            {text: makeUpperCase('Input'), fontSize: 10, margin: [0, 20, 0, 6], color: '#442A8E'},
               {image:bgImg,  width: 550,
                          height: 0.5, marginBottom:5},
                          { text: tx.input, fontSize:10 }
          ]
          
        }

       // docDefinition.content.splice(1, 0, { text: typeHeadings[tx.type], fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] })

        switch (tx.type) {
          case 'send-ether':
            docDefinition.content.splice(-6,0,{ text: makeUpperCase('Transaction Data'), fontSize: 10, margin: [0, 20, 0, 6],  color: '#442A8E'},{image:bgImg,  width: 550,
              height: 0.5, marginBottom:5},{
              table: {
                widths: ['*'],
                // body: [['Direction', 'Received'], ['Value', generalRounding(calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0])) + ' ETH'], ['Sender', transfersList.filter(l => l.name === 'Withdrawal')[0].params.src]]
                body: [
                  [tx.from],
                [{
                  image: arrowImg,
                  width: 5, // устанавливаем ширину изображения
                  height: 10,
                }],
                [String(tx.data.value) + 'ETH'],
                [{
                  image: arrowImg,
                  width: 5, // устанавливаем ширину изображения
                  height: 10,
                }],
                [tx.to],
                ]
              },
              style: 'tableStyle',
              layout: 'noBorders'
            })
            // docDefinition.content.splice(2, 0, {
            //   table: {
            //     widths: ['*', 'auto'],
            //     body: [
            //       ['Value', String(tx.data.value)],
            //       ['Recipient', tx.to],
            //     ]
            //   }
            // })
            break
          case 'send-erc20-token':
            docDefinition.content.splice(2, 0, {
              table: {
                widths: ['*', 'auto'],
                body: [
                  //['Direction', 'Send ?'],
                  ['Contract', tx.data.contract],
                  ['Value', tx.data.contractInfo && tx.data.contractInfo.decimals
                    ? new BigNumber(tx.data.value).dividedBy(Math.pow(10, tx.data.contractInfo.decimals)).dp(6).toString()
                    : new BigNumber(tx.data.value).dp(6).toString()],
                  ['Sender', tx.from]
                  // ['Recipient', 'addressCurrent??']
                ]
              }
            })
            break
          case 'call':
            if (tx.logs.some(log => log.contractInfo)) {
              // docDefinition.content.splice(5, 0, {
              //   table: {
              //     widths: ['*',50],
              //     body: [
              //       ['Contract Address:', tx.to],
              //     ]
              //   }
              // })

              docDefinition.content.splice(6,0, {text: makeUpperCase('Transaction Data'), fontSize: 10, margin: [0, 20, 0, 6], color: '#442A8E'},
               {image:bgImg,  width: 550,
                          height: 0.5, marginBottom:5})
              const transfersList = tx.logs.filter(obj => obj.contractInfo)
              if (transfersList.length) {
                transfersList.forEach(transfer => {
                  // Title transfer
                  const titleText = transfer.contractInfo.name ? transfer.contractInfo.name : transfer.contractInfo.address;

                  // Body transfer
                  let tableBody = [];
                  if (transfer.name === 'Transfer') {
                    tableBody = [
                      //['Direction', 'addressCurrent??'],
                      [ transfer.contractInfo.address],
                      [{
                        image: arrowImg,
                        width: 5, 
                        height: 10,
                      }],
                      [ calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                      [{
                        image: arrowImg,
                        width: 5, 
                        height: 10,
                      }],
                      [ transfer.params.to],
                    ];
                  } else if (transfer.name === 'Deposit') {
                    tableBody = [
                      [transfer.contractInfo.address],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [transfer.params.user],
                    ];
                  } else if (transfer.name === 'Withdrawal') {
                    tableBody = [
                      [transfer.contractInfo.address],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [calcLogEntryValue(transfer) + ' ' + transfer.contractInfo.symbol],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [transfer.params.src],
                    ];
                  }

                  if (tableBody.length > 0) {
                    docDefinition.content.splice(6,0,{ text: makeUpperCase('Token transfer'), fontSize: 10, margin: [0, 10, 0, 0],  color: '#442A8E'}, 
                    {image:bgImg,  width: 550,
                        height: 0.5, marginBottom:5},{
                      table: {
                        widths: ['*'],
                        body: tableBody,
                        alignment: 'center'
                      },
                      style: 'tableStyle',
                      layout: 'noBorders'
                    })
                    
                  }

               //   docDefinition.content.push(' ')
                })

                if (transfersList.some(l => l.name === 'Withdrawal')) {
                  docDefinition.content.splice(-6,0,{ text: makeUpperCase('Ether'), fontSize: 10, margin: [0, 20, 0, 6],  color: '#442A8E'},{image:bgImg,  width: 550,
                    height: 0.5, marginBottom:5},{
                    table: {
                      widths: ['*'],
                      // body: [['Direction', 'Received'], ['Value', generalRounding(calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0])) + ' ETH'], ['Sender', transfersList.filter(l => l.name === 'Withdrawal')[0].params.src]]
                      body: [
                        [tx.from],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [ generalRounding(calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0])) + 'ETH'],
                      [{
                        image: arrowImg,
                        width: 5, // устанавливаем ширину изображения
                        height: 10,
                      }],
                      [transfersList.filter(l => l.name === 'Withdrawal')[0].params.src],
                      ]
                    },
                    style: 'tableStyle',
                    layout: 'noBorders'
                  })
                }
              }
            }
            break
          case 'deploy-contract':
            break
          case 'message':
            docDefinition.content.splice(2, 0, {
              table: {
                widths: [100, '*'],
                body: [
                  ['Message', formatMessage(tx.data)]
                ]
              }
            })
            break
          case 'swap':
            break
          case 'approval':
            break
          case 'nft-trade':
            break
          case 'send-nft':
            const logs = tx.logs.filter(l => l.name === 'Transfer' && Object.keys(l.params).includes('nft_id'))
            docDefinition.content.splice(-6,0,{ text: makeUpperCase('Transaction Data'), fontSize: 10, margin: [0, 20, 0, 6],  color: '#442A8E'},{image:bgImg,  width: 550,
              height: 0.5, marginBottom:5},{
              table: {
                widths: ['*'],
                // body: [['Direction', 'Received'], ['Value', generalRounding(calcLogEntryValue(transfersList.filter(l => l.name === 'Withdrawal')[0])) + ' ETH'], ['Sender', transfersList.filter(l => l.name === 'Withdrawal')[0].params.src]]
                body: [
                  [logs[0]['params']['from']],
                [{
                  image: arrowImg,
                  width: 5, // устанавливаем ширину изображения
                  height: 10,
                }],
                ['?'+ 'ETH'],
                [{
                  image: arrowImg,
                  width: 5, // устанавливаем ширину изображения
                  height: 10,
                }],
                [logs[0]['contract']],
                ]
              },
              style: 'tableStyle',
              layout: 'noBorders'
            })
            // const logs = tx.logs.filter(l => l.name === 'Transfer' && Object.keys(l.params).includes('nft_id'))
            // docDefinition.content.splice(2, 0, {
            //   table: {
            //     widths: ['*', 'auto'],
            //     body: [
            //       //['Direction', 'Send ?'],
            //       ['Contract', logs[0]['contract']],
            //       ['Sender', logs[0]['params']['from']]
            //     ]
            //   }
            // })
            break
          case 'nft-mint':
            break
          case 'lend':
            break
          case 'redeem':
            break
        }

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const fileStream = pdfDoc.pipe(fs.createWriteStream('./pdf/document.pdf'));

        pdfDoc.pipe(fs.createWriteStream('document.pdf'));
        pdfDoc.pipe(res);

        pdfDoc.end();
      })
      function formatMessage(item, message = '', invisibleSpace) {
        if (isJsonString(item)) {
          const moneyRequest = JSON.parse(item.message)
          message = moneyRequest.moneyRequest.text || ''
          message = message.length > 15
            ? message.slice(0, 8) + '...'
            : message || invisibleSpace
        } else if (item.message) {
          message = item.message.length > 15
            ? item.message.slice(0, 8) + '...'
            : item.message
        } else {
          return invisibleSpace
        }
        return message
      }

      function isJsonString(str) {
        try {
          if (JSON.parse(str.message)?.moneyRequest) {
            return true
          }
        } catch (e) {
          return false
        }
      }

      function generalRounding(number, places = 6) {
        let result, left, right
        let string = String(number)

        if (string.includes('e') || string === '') {
          return number
        }

        if (string.includes('.')) {
          left = string.split('.')[0]
          right = string.split('.')[1]
        } else {
          left = string
          right = ''
        }

        if (left.length > places) {
          // metric prefixes
          if (left.length <= 9) result = (left / Math.pow(10, 6)).toFixed(1) + ' ' + i18n.t('base.M')
          else if (left.length <= 12) result = (left / Math.pow(10, 9)).toFixed(1) + ' ' + i18n.t('base.B')
          else if (left.length <= 15) result = (left / Math.pow(10, 12)).toFixed(1) + ' ' + i18n.t('base.T')
          else result = (left / Math.pow(10, 15)).toFixed(1) + ' ' + i18n.t('base.Q')
        } else {
          result = Number(left + '.' + right.slice(0, places - left.length))
        }
        return result
      }

      function calcLogEntryValue(logEntry) {
        let field
        switch (logEntry.name) {
          case 'Transfer':
            field = 'value'
            break
          case 'Deposit':
            field = 'amount'
            break
          case 'Withdrawal':
            field = 'wad'
            break
        }
        return new BigNumber(logEntry.params[field]).dividedBy(Math.pow(10, logEntry.contractInfo.decimals || 0)).dp(6).toString()
      }

      function status(status) {
        if (status === undefined) {
          return 'Pending'
        } else {
          if (status === 0) {
            return 'Failed'
          } else if (status === 1) {
            return 'Confirmed'
          } else {
            return 'Unknown'
          }
        }
      }
      function makeUpperCase(text) {
        return text.toUpperCase()
      }
      // res.send();
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})

module.exports = router
