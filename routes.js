const express = require('express')
const router = express.Router()
var request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const cors = require('cors')

const PdfPrinter = require('pdfmake');
const fs = require('fs');

const path = require('path');
router.get('/generate', cors(), (req, res) => {
  var customHeaders = {
  };
  var requestOptions = {
    url: 'https://api-dev-full.sinum.io/widgets/explorer/transaction/0x6e15500dee8ec125ff971afbf05bea535d069afe2fcaa1c24ab4e723991e3dbb?blockchain=ethereum',
    headers: customHeaders,
  };
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const tx = JSON.parse(body);
      console.log(tx.data.type)
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
        // 'message': this.tx && this.tx.data && isJsonString(this.tx.data) && this.tx.to.toLowerCase() === this.addressCurrent
        //     ? 'Invoice Tx'
        //     : 'Message Tx',
        'swap': 'Swap Transaction',
        'nft-trade': 'NFT Trade Tx',
        'send-nft': 'NFT Transaction',
        'nft-mint': 'NFT Mint',
        'lend': 'Lend Tx',
        'redeem': 'Redeem Tx'
      }

      function timeToStringLocal(time) {
        let stamp = time,
          date = new Date(stamp)

        return ('00' + date.getDate()).slice(-2) + '.' +
          ('00' + (date.getMonth() + 1)).slice(-2) + '.' +
          date.getFullYear() + ' ' +
          ('00' + date.getHours()).slice(-2) + ':' +
          ('00' + date.getMinutes()).slice(-2) + ':' +
          ('00' + date.getSeconds()).slice(-2)
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
      function generateLogs(logs) {
        const arr = {
            table: {
              widths: ['*', 'auto'],

              body: [['Input',  '?']],
            },
            table: {
              widths: ['*', 'auto'],

              body: [['Input', '?']],
            }
  
  
        }
        return arr
        // return [
        //   // [ 'First', 'Second' ],
        //   ['From', tx.data.from],
        //   ['To', tx.data.to],
        // ]
      }
//////////////////////

//////////////
      const printer = new PdfPrinter(fonts);
      const docDefinition = {
        content: [
          {
            margin: [0, 0, 0, 20],
            table: {
              widths: ['*', '*'],

              body: [
                [timeToStringLocal(tx.data.timeStamp * 1000), status(tx.data.status)],
              ]
            }
          },
          { text: typeHeadings[tx.data.type], fontSize: 15, alignment: 'center', bold: true, margin: [0, 0, 20, 20] },
          {
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['Direction', 'Send ?'],
                ['Value', tx.data.value],
                ['Recipient', tx.data.to],
              ]
            }
          },
          { text: 'Transaction Data', fontSize: 15, alignment: 'center', bold: true, margin: [0, 50, 20, 20] },
          {
            table: {
              widths: ['*', 'auto'],

              body: [
                // [ 'First', 'Second' ],
                ['From', tx.data.from],
                ['To', tx.data.to],
                ['Block', tx.data.blockNumber],
                ['Hash', tx.data.hash],
                ['Nonce', tx.data.nonce],
                ['Value', tx.data.value],
                ['Gas Used', tx.data.gasUsed],
                ['Gas Price', tx.data.gasPrice],
                ['Fee', '0.000018 ?'],
                ['Input', tx.data.input + '?'],
              ]
            }
          },
       
        //   {
        //     table: {
        //       widths: ['*', 'auto'],
        //       body: [['Input',  '?']],
        //     }
  
        // },
        // {
        //   table: {
        //     widths: ['*', 'auto'],
        //     body: [['Input',  '?']],
        //   }
        // }
          // {
          //   table: {
          //     widths: ['*', 'auto'],

          //     body: [generateLogs(tx.data.logs)],
          //     body: [generateLogs(tx.data.logs)]
          //   }
          // }

        ]
      };
      if(tx.data.logs.length){
      docDefinition.content.push({ text: 'Full Logs', fontSize: 15, alignment: 'center', bold: true, margin: [0, 50, 20, 20] })
      for(var i=0;i<tx.data.logs.length;i++) {
      //  console.log(tx.data.logs[i].params)
        docDefinition.content.push({
          table: {
            widths: [70, '*'],
            body: [
            ['Name',  tx.data.logs[i].name], 
            ['Contract',  tx.data.logs[i].contract], 
            ['Owner',  tx.data.logs[i].params?.owner ? tx.data.logs[i].params.owner : null], 
            ['Spender',  tx.data.logs[i].params?.spender ? tx.data.logs[i].params.spender :null], 
            ['Value',  tx.data.logs[i].params?.value ? tx.data.logs[i].params.value : null], 
            ['Nft id',  tx.data.logs[i].params?.nft_id ? tx.data.logs[i].params.nft_id : null], 
          
          ],
          
          }
        })
        //docDefinition.content.push(['Owner', '111'] )
  
        docDefinition.content.push(' ');

      
      }

      // function removeElement(array, elementToRemove) {
      //   const index = array.indexOf(elementToRemove);
      //   if (index !== -1) {
      //     array.splice(index, 1);
      //   }
      // }
      
      // Iterate through the outer array
      // function removeElementFromArray(array, elementToRemove) {
      //   const index = array.indexOf(elementToRemove);
      //   if (index !== -1) {
      //     array.splice(index, 1);
      //   }
      // }
      
      // Iterate through the array
      // docDefinition.content.forEach((element) => {
      //   // Check if the element has a 'body' property and is an array
      //   if (element.table && element.table.body) {
      //     // Iterate through the 'body' array
      //     element.table.body.forEach((innerArray) => {
      //       // Remove 'M' from the inner array
      //       removeElementFromArray(innerArray, 'empty');
      //     });
      //   }
      // });
      console.log('target', docDefinition.content)
    }
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const fileStream = pdfDoc.pipe(fs.createWriteStream('./pdf/document.pdf'));

      //pdfDoc.pipe(fileStream);

      // fileStream.on('finish', () => {
      //   res.download('document.pdf', () => {
      //     const filePath = path.resolve('document.pdf');
      //     fs.unlink(filePath, (err) => {
      //       if (err) {
      //         console.error(err);
      //       }
      //     });
      //   });

      // });
      pdfDoc.pipe(fs.createWriteStream('document.pdf'));
      pdfDoc.pipe(res);

      pdfDoc.end();

      // res.send();
    } else {
      console.log('err', error)
      res.send(error)
    }
  });
})

module.exports = router
