import { BytePlusServiceClient  } from '../utils/base.ts'
import { BP_CONFIG } from '../../cred/index.ts'

const clusterID = ''

const addons = [
    {
        Name: 'vpc-cni'
    },
    {
        Name: 'core-dns',
        Config: JSON.stringify(JSON.stringify({
            Resource: {
                Request: {
                    Cpu: '250m',
                    Memory: '500Mi'
                },
                Limit: {
                    Cpu: '1Gi',
                    Memory: '2Gi'
                }
            }
        }))
    },
    {
        Name: 'cloud-controller-manager',
        Config: JSON.stringify(JSON.stringify({}))
    },
    {
        Name: 'metrics-server',
        Config: JSON.stringify(JSON.stringify({
            Resource: {
                Request: {
                    Cpu: '250m',
                    Memory: '500Mi'
                },
                Limit: {
                    Cpu: '500m',
                    Memory: '1Gi'
                }
            }
        }))
    },
    {
        Name: 'csi-ebs',
        Config: JSON.stringify(JSON.stringify({
            Resource: {
                Request: {
                    Cpu: '250m',
                    Memory: '500Mi'
                },
                Limit: {
                    Cpu: '500m',
                    Memory: '1Gi'
                }
            }
        }))
    },
    {
        Name: 'ingress-nginx',
        Config: JSON.stringify(JSON.stringify({
            Replica: 1,
            Resource: {
                Request: {
                    Cpu: '250m',
                    Memory: '500Mi'
                },
                Limit: {
                    Cpu: '500m',
                    Memory: '1Gi'
                }
            },
            PublicNetwork: {
                LanType: 'BGP',
                BandWidthLimit: 100,
                IpVersion: 'IPV4',
                BillingType: 3,
                SubnetId: 'subnet-22qbuh1g1yznkds3n9fl542r',

            }
        }))
    },
    {
        Name: 'cluster-autoscaler',
        Config: JSON.stringify(JSON.stringify({
            Expander: 'least-waste',
            ScaleDownEnabled: true,
            ScaleDownUtilizationThreshold: 0.6,
            ScaleDownGpuUtilizationThreshold: 0.2,
            ScaleDownUnneededTime: 30,
            ScaleDownDelayAfterAdd: 1,
            ScaleDownDelayAfterFailure: 1,
            MaxEmptyBulkDelete: 4
        }))
    },
    {
        Name: 'prometheus-agent',
        Config: JSON.stringify(JSON.stringify({
            NodeExporterDisabled: false,
            AutoScalingEnabled: true,
            VmAgent: {
                InitShards: 1,
                MaxShards: 5,
                Requests: {
                    Cpu: '500m',
                    Memory: '500Mi'
                },
                Limit: {
                    Cpu: '1',
                    Memory: '1Gi'
                }
            },
            KubeStateMetrics: {
                InitShards: 1,
                MaxShards: 5,
                Requests: {
                    Cpu: '250m',
                    Memory: '250Mi'
                },
                Limit: {
                    Cpu: '500m',
                    Memory: '500Mi'
                }
            }
        }))
    },
]

const main = async(n: any) => {

    const vkeClient = new BytePlusServiceClient({service: 'vke', version: "2022-05-12", credentials: BP_CONFIG.credentials, region: BP_CONFIG.region});

    return vkeClient.request('CreateAddon', {
        ClusterId: clusterID,
        ...n
    })
}

Promise.all(addons.map(n => main(n)))
.then(data => {
    console.log(data)
})
.catch(error => console.log(error))