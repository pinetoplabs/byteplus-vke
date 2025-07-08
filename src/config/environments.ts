export const environmentConfigs = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    instanceType: 'ecs.t2-c2m1.large',
    nodeCount: { desired: 3, min: 2, max: 10 },
    volumeType: 'ESSD_PL0',
    systemVolumeSize: 100,
    dataVolumeSize: 200
  },
  stage: {
    vpcCidr: '10.1.0.0/16',
    instanceType: 'ecs.t2-c2m1.large',
    nodeCount: { desired: 4, min: 3, max: 15 },
    volumeType: 'ESSD_PL0',
    systemVolumeSize: 100,
    dataVolumeSize: 300
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    instanceType: 'ecs.t2-c2m1.large',
    nodeCount: { desired: 6, min: 4, max: 20 },
    volumeType: 'ESSD_PL1',
    systemVolumeSize: 200,
    dataVolumeSize: 500
  }
};