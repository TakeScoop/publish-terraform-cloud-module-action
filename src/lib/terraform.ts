import * as path from 'path'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'

export interface ClientOptions {
  token: string,
  host?: string,
  version?: string
}

export interface ClientInstance extends AxiosInstance {}
export interface ClientResponse extends AxiosResponse {}

export function Client ({ token, host = 'app.terraform.io', version='/api/v2' }: ClientOptions): ClientInstance {
  return axios.create({
    baseURL: `https://${path.join(host, version)}`,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${token}`,
    }
  } as AxiosRequestConfig)
}
