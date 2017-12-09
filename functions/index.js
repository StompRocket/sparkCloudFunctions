// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions')

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
var db = admin.database()
exports.newMessage = functions.database.ref('/chats/{chatId}/')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val()
      const lastMessage = original.mesages[Object.keys(original.mesages)[Object.keys(original.mesages).length - 1]]
      const members = original.members
      const sender = lastMessage.sender.uid
      const payload = {
        notification: {
          title: lastMessage.sender.name,
          body: lastMessage.text
        }
      }
      console.log('sender ' + sender)
      let i = 0
      while (i < Object.keys(members).length) {
        let person = members[Object.keys(members)[i]]
        let personUID = person.uid
        //let shouldISend = person.send
        console.log(person + ' uid ' + personUID + ' i ' + i)
        if (personUID == sender) {
          console.log('sender')
        } else {
          console.log('sending to ' + personUID)
          let userRef = db.ref('users/' + personUID + '/tokens')
          userRef.once('value', function (data) {
            if (data.val()) {
              let reciverTokens = []
              console.log('tokens ' + JSON.stringify(data.val()))
              let e = 0
              while (e < Object.keys(data.val()).length) {
                let token = data.val()[Object.keys(data.val())[e]].token
                reciverTokens.push(token)
                e++
                if (e == Object.keys(data.val()).length) {
                  console.log(reciverTokens)
                  admin.messaging().sendToDevice(reciverTokens, payload)
                    .then(function (response) {
                      // See the MessagingDevicesResponse reference documentation for
                      // the contents of response.
                      console.log('Successfully sent message:', JSON.stringify(response))
                    })
                  .catch(function (error) {
                    console.log('Error sending message:', JSON.stringify(error))
                  })
                }
              }
            } else {
              console.log('NO tokens ' + personUID)
            }
          })
        }
        i++
      }
      //  console.log('new message', original.messages[Object.keys(original.messages)[Object.keys(original.messages).length - 1]])
      console.log(original.members)
      console.log(lastMessage)
      return original
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    })
