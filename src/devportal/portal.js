const axios = require('axios')
const qs = require('qs')
const SwaggerParser = require("@apidevtools/swagger-parser");
const yaml = require('js-yaml')
const fs = require('fs-extra')
const FormData = require('form-data')

class Portal {
    constructor(config) {
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

    async login() {
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

    readSwaggerFile(spec) {
        const swagger = fs.readFileSync(spec, 'utf8')

        if (spec.endsWith('.yml') || spec.endsWith('.yaml')) {
            return yaml.safeLoad(swagger)
        }
        if (spec.endsWith('.json')) {
            return JSON.parse(swagger)
        }
        throw new Error('Openapi spec must be either yaml/yml or json')
    }

    async pushSwagger(swagger) {
      const parsedSwagger = await this.readSwaggerFile(swagger)
      await SwaggerParser.validate(swagger);
      await this.login()
        return this.request.post(`api/environments/${this.config.environment}/apiproducts/${this.config.product}/specs${this.config.force ? '?force=true' : ""}`, {
            "environmentId": this.config.environment,
            'spec': parsedSwagger
        })
    }

  async pushMarkdown (zipFile) {
    await this.login()
    const form = new FormData()
    form.append('zip', zipFile, {
      filename: 'markdown.zip'
    })
    return axios.post(`http://${this.config.hostname}/markdown`,
      form.getBuffer(),
      {
        headers: {
          ...form.getHeaders(),
          Authorization: this.request.defaults.headers.common['Authorization']
        }
      })
  }
}

module.exports = Portal
