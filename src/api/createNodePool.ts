import { BytePlusServiceClient  } from '../utils/base.ts'
import { BP_CONFIG } from '../../cred/index.ts'

const instanceGenxLarge = {InstanceTypeIds:['ecs.g3a.xlarge'], NamePrefix: 'brt-gen-xlg'}

const main = async() => {

    const vkeClient = new BytePlusServiceClient({service: 'vke', version: "2022-05-12", credentials: BP_CONFIG.credentials, region: BP_CONFIG.region});

    return vkeClient.request('CreateNodePool', {
        ClusterId: '',
        Name: 'node-gen-xlarge',
        NodeConfig: {
            ...instanceGenxLarge,
            SubnetIds: ['subnet'],
            Security: {
                // SecurityGroupIds: [],
                Login: {
                    SshKeyPairName: ''
                }
            },
            InstanceChargeType: 'PostPaid',
            AutoRenew: true,
            AutoRenewPeriod: 1
        },
        AutoScaling: {
            Enabled: true,
            MaxReplicas: 10,
            MinReplicas: 0
        }
    })
}

main()
.then(data => {
    console.log(data)
})
.catch(error => console.log(error))