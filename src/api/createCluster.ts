import { BytePlusServiceClient  } from '../utils/base.ts'
import { BP_CONFIG } from '../../cred/index.ts'

const tags = {
    mode: 'hybrid',
    section: 'hybrid'
}

const main = async() => {

    const vkeClient = new BytePlusServiceClient({service: 'vke', version: "2022-05-12", credentials: BP_CONFIG.credentials, region: BP_CONFIG.region});

    return vkeClient.request('CreateCluster', {
        Name: 'cluster-name',
        Description: 'Main cluster',
        DeleteProtectionEnabled: true,
        ClusterConfig: {
            SubnetIds: ['subnet'],
        },
        PodsConfig: {
            PodNetworkMode: 'VpcCniShared',
            VpcCniConfig: {
                SubnetIds: ['subnet']
            }
        },
        ServicesConfig: {
            ServiceCidrsv4: ["10.120.128.0/22"]
        }, 
        Tags: Object.keys(tags).map(k => ({Key: k, Value: tags[k]})),
        KubernetesVersion: 'v1.30.4-vke.7'
    })
}

main()
.then(data => {
    console.log(data)
})
.catch(error => console.log(error))