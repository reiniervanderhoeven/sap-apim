const axios = require('axios')
const qs = require('qs')

class Portal {
  constructor (config) {
    this.config = config
    this.request = axios.create({
      baseURL: `http://${this.config.hostname}`,
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  async login () {
    const data = {
      'client_id': this.config.clientId,
      'client_secret': this.config.clientSecret,
      'grant_type': this.config.grantType,
      'scope': this.config.scope
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify(data),
      url: `https://${this.config.tokenUrl}/token`
    }
    const response = await axios(options)
    this.request.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token
  }

  async pushSwagger(swagger) {
    await this.login()
    return this.request.post(`api/environments/${this.config.environment}/apiproducts/${this.config.product}/specs${this.config.force ? '?force=true' : ""}`, {
      "environmentId": this.config.environment,
      'spec': swagger
    })
  }

  async pushMarkdown (zipFile) {
    console.log(zipFile)
    await this.login()
    return this.request(`/markdown`, {
      method: 'POST',
      formData: {
        zip: zipFile
      }

    })
  }
}

module.exports = Portal
