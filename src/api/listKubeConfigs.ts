import { BytePlusServiceClient  } from '../utils/base.ts'
import { BP_CONFIG } from '../../cred/index.ts'

const main = async() => {

    const vkeClient = new BytePlusServiceClient({service: 'vke', version: "2022-05-12", credentials: BP_CONFIG.credentials, region: BP_CONFIG.region});
    
    return vkeClient.request('ListKubeconfigs', {})
}

main()
.then(data => {
    console.log(data)
    console.log(data.Result?.Items)
})
.catch(error => console.log(error))