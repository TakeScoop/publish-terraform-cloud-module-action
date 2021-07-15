import * as path from 'path'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'

export interface ClientOptions {
  token: string,
  host?: string,
  version?: string
}

export {AxiosInstance as ClientInstance}
export {AxiosResponse as ClientResponse}

export function Client ({ token, host = 'app.terraform.io', version='/api/v2' }: ClientOptions): AxiosInstance {
  return axios.create({
    baseURL: `https://${path.join(host, version)}`,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${token}`,
    }
  } as AxiosRequestConfig)
}
