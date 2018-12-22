import Vue from 'vue'
import axios from 'axios'
import bcrypt from 'bcryptjs'
import { SHA256, AES, EC, MessageHandler } from './util'
// import Blob from 'blob'

axios.defaults.baseURL = 'https://ccm.ntut.com.tw/api'
// axios.defaults.baseURL = 'http://localhost:8787/api'
axios.defaults.withCredentials = true
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8'
axios.defaults.headers.post['Access-Control-Allow-Origin'] = 'http://localhost:8080'

class API {
  // User Api
  static async sayHelloToServer () {
    console.log('hello')
    let data = (await axios.get('/session')).data
    return data
  }
  static async login (username, password, code) {
    console.log('login')
    try {
      let salt = '$2b$10$' + SHA256.hash(username).slice(0, 22)
      let hash1 = await bcrypt.hash(password, salt)
      let hash2 = await bcrypt.hash(hash1, code)
      let { data } = await axios.post('/session', {
        username,
        password: hash2
      })
      let key = SHA256.hash(password).slice(0, 32)
      let iv = SHA256.hash(username).slice(0, 16)
      data.privateKey = AES.decrypt(data.privateKey, key, iv)
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401) {
        return { error: status }
      }
    }
  }
  static async logout () {
    console.log('logout')
    try {
      await axios.delete('/session')
      return {}
    } catch (e) {
      let status = e.response.status
      if (status === 404) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  static async register (username, secret) {
    try {
      let { data } = await axios.post('/user', {
        username,
        secret
      })
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  static async getUserInfo (receiverUsername) {
    try {
      let { data } = await axios.get(`/user/${receiverUsername}`)
      return data
    } catch (e) {
      console.log('not found ' + receiverUsername)
      let status = e.response.status
      if (status === 404) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  // Chat Api
  static async getChatRooms () {
    try {
      let { data } = await axios.get('/chat')
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  static async createChatRoom (receiverUsername) {
    try {
      let { data } = await axios.post('/chat', { username: receiverUsername })
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401 || status === 403) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  static async getChatRoomMessageKey (receiverUsername, privateKey) {
    try {
      let { data } = await axios.get(`/chat/${receiverUsername}`)
      try {
        // privatekey utf8
        data.messageKey = JSON.parse(data.messageKey)
        data.messageKey = await EC.decrypt(data.messageKey, privateKey)
        console.log(data.messageKey)
      } catch (e) {
        console.log(e)
      }
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401 || status === 404) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
  static async getChatRoomMessages (receiverUsername, index, count, messageKey) {
    try {
      let params = {}
      if (index) params.index = index
      if (count) params.count = count
      let { data } = await axios.get(`/chat/${receiverUsername}/message`, { params })
      console.log(data)
      data.messages.forEach((message) => {
        MessageHandler.decrypt(message, messageKey)
      })
      return data
    } catch (e) {
      let status = e.response.status
      if (status === 401 || status === 404) {
        return { error: status }
      } else {
        console.log(e)
        throw e
      }
    }
  }
  static async getChatRoomLastMessage (receiverUsername, messageKey) {
    let { error, messages } = await API.getChatRoomMessages(receiverUsername, undefined, undefined, messageKey)
    return { error, message: messages[0] }
  }
  static async sendChatRoomMessage (senderUsername, receiverUsername, message, messageKey) {
    try {
      console.log(1, message)
      MessageHandler.encrypt(senderUsername, message, messageKey)
      console.log(2, message)
      let { data } = await axios.post(`/chat/${receiverUsername}/message`, message)
      let sendedMessage = data
      console.log(3, sendedMessage)
      MessageHandler.decrypt(sendedMessage, messageKey)
      console.log(4, sendedMessage)
      return { sendedMessage }
    } catch (e) {
      let status = e.response.status
      if (status === 401 || status === 404) {
        return { error: status }
      } else {
        throw e
      }
    }
  }
}

Vue.use(() => {
  Vue.prototype.$api = API
})
